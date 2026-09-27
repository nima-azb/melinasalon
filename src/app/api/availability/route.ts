import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SLOT_INTERVAL_MINUTES,
  getSalonDayBounds,
  isValidCalendarDateString,
} from "@/lib/time/salon-time";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(
      `availability:${getClientIp(request)}`,
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

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "انتخاب سرویس الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!isValidCalendarDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ وارد شده معتبر نیست.",
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
        duration: true,
        isActive: true,
        capacity: true,
        oneBookingPerDay: true,
      },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "سرویس انتخاب شده موجود نیست.",
        },
        { status: 404 },
      );
    }

    const { startOfDay, endOfDay, dayOpen, dayClose } = getSalonDayBounds(date);

    const now = new Date();

    const [bookings, blockedTimes] = await Promise.all([
      prisma.booking.findMany({
        where: {
          serviceId,
          status: "CONFIRMED",
          startsAt: {
            lt: endOfDay,
          },
          endsAt: {
            gt: startOfDay,
          },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
        },
      }),

      prisma.blockedTime.findMany({
        where: {
          serviceId,
          startsAt: {
            lt: endOfDay,
          },
          endsAt: {
            gt: startOfDay,
          },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const hasBookingForDay = service.oneBookingPerDay && bookings.length > 0;

    const timeSlots: Array<{
      startsAt: Date;
      endsAt: Date;
      available: boolean;
    }> = [];

    let currentStart = new Date(dayOpen);

    while (currentStart < dayClose) {
      const currentEnd = new Date(
        currentStart.getTime() + service.duration * 60 * 1000,
      );

      if (currentEnd > dayClose) {
        break;
      }

      if (currentStart > now && !hasBookingForDay) {
        const overlappingBookingsCount = bookings.filter((booking) =>
          intervalsOverlap(
            currentStart,
            currentEnd,
            booking.startsAt,
            booking.endsAt,
          ),
        ).length;

        const isFull = overlappingBookingsCount >= service.capacity;

        const overlapsBlockedTime = blockedTimes.some((blockedTime) =>
          intervalsOverlap(
            currentStart,
            currentEnd,
            blockedTime.startsAt,
            blockedTime.endsAt,
          ),
        );

        if (!isFull && !overlapsBlockedTime) {
          timeSlots.push({
            startsAt: new Date(currentStart),
            endsAt: currentEnd,
            available: true,
          });
        }
      }

      currentStart = new Date(
        currentStart.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000,
      );
    }

    return NextResponse.json({
      success: true,
      date,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
        capacity: service.capacity,
        oneBookingPerDay: service.oneBookingPerDay,
      },
      timeSlots,
    });
  } catch (error) {
    console.error("GET /api/availability error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت زمان‌های قابل رزرو.",
      },
      { status: 500 },
    );
  }
}
