import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SALON_CLOSE_HOUR,
  SALON_OPEN_HOUR,
  SLOT_INTERVAL_MINUTES,
  getSalonDayBounds,
  isValidCalendarDateString,
  isWithinSalonHours,
} from "@/lib/time/salon-time";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createBlockedTimeSchema = z.object({
  serviceId: z.string().trim().min(1),
  date: z.string().trim().min(1),
  startTime: z.string().regex(timePattern, "Invalid start time"),
  endTime: z.string().regex(timePattern, "Invalid end time"),
  reason: z.string().trim().max(500).optional(),
});

function createTehranDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+03:30`);
}

function isTimeOnInterval(time: string): boolean {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  return totalMinutes % SLOT_INTERVAL_MINUTES === 0;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const serviceId = searchParams.get("serviceId");

    const where: {
      startsAt?: {
        gte?: Date;
        lt?: Date;
      };
      serviceId?: string;
    } = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (date) {
      if (!isValidCalendarDateString(date)) {
        return NextResponse.json(
          {
            success: false,
            message: "تاریخ وارد شده معتبر نیست.",
          },
          { status: 400 },
        );
      }

      const { startOfDay, endOfDay } = getSalonDayBounds(date);

      where.startsAt = {
        gte: startOfDay,
        lt: endOfDay,
      };
    } else if (fromDate || toDate) {
      if (fromDate && !isValidCalendarDateString(fromDate)) {
        return NextResponse.json(
          {
            success: false,
            message: "تاریخ شروع معتبر نیست.",
          },
          { status: 400 },
        );
      }

      if (toDate && !isValidCalendarDateString(toDate)) {
        return NextResponse.json(
          {
            success: false,
            message: "تاریخ پایان معتبر نیست.",
          },
          { status: 400 },
        );
      }

      const startsAt: {
        gte?: Date;
        lt?: Date;
      } = {};

      if (fromDate) {
        startsAt.gte = getSalonDayBounds(fromDate).startOfDay;
      }

      if (toDate) {
        startsAt.lt = getSalonDayBounds(toDate).endOfDay;
      }

      where.startsAt = startsAt;
    }

    const blockedTimes = await prisma.blockedTime.findMany({
      where,
      orderBy: {
        startsAt: "asc",
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      blockedTimes,
    });
  } catch (error) {
    console.error("GET /api/admin/blocked-times error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت زمان‌های مسدود با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const rateLimit = checkRateLimit(
      `admin-blocked-times:${getClientIp(request)}`,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body: unknown = await request.json();

    const result = createBlockedTimeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات زمان مسدود معتبر نیست.",
          errors: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { serviceId, date, startTime, endTime, reason } = result.data;

    if (!isValidCalendarDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ وارد شده معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (!isTimeOnInterval(startTime) || !isTimeOnInterval(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: `زمان‌ها باید با فاصله‌های ${SLOT_INTERVAL_MINUTES} دقیقه‌ای انتخاب شوند.`,
        },
        { status: 400 },
      );
    }

    const startMinutes =
      Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));

    const endMinutes =
      Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان پایان باید بعد از زمان شروع باشد.",
        },
        { status: 400 },
      );
    }

    const startsAt = createTehranDate(date, startTime);
    const endsAt = createTehranDate(date, endTime);

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: `زمان مسدود باید داخل ساعات کاری سالن (${String(
            SALON_OPEN_HOUR,
          ).padStart(2, "0")}:00 تا ${String(SALON_CLOSE_HOUR).padStart(
            2,
            "0",
          )}:00) باشد.`,
        },
        { status: 400 },
      );
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "امکان ایجاد زمان مسدود در گذشته وجود ندارد.",
        },
        { status: 400 },
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت انتخاب شده یافت نشد.",
        },
        { status: 404 },
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "امکان ایجاد زمان مسدود برای خدمت غیرفعال وجود ندارد.",
        },
        { status: 409 },
      );
    }

    /*
     * A blocked period is service-specific.
     *
     * Therefore:
     * - a booking for another service does NOT prevent this block
     * - another service's blocked period does NOT prevent this block
     */
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: "CONFIRMED",
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        id: true,
      },
    });

    if (overlappingBooking) {
      return NextResponse.json(
        {
          success: false,
          message:
            "در این بازه برای این خدمت نوبت تأییدشده وجود دارد و امکان مسدود کردن آن وجود ندارد.",
        },
        { status: 409 },
      );
    }

    const overlappingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        serviceId,
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        id: true,
      },
    });

    if (overlappingBlockedTime) {
      return NextResponse.json(
        {
          success: false,
          message: "این بازه برای همین خدمت قبلاً مسدود شده است.",
        },
        { status: 409 },
      );
    }

    const blockedTime = await prisma.blockedTime.create({
      data: {
        serviceId,
        startsAt,
        endsAt,
        reason: reason || null,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "زمان مسدود با موفقیت ثبت شد.",
        blockedTime,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/blocked-times error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ثبت زمان مسدود با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
