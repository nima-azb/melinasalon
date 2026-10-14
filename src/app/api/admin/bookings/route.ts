import { NextRequest, NextResponse } from "next/server";

import { BookingStatus, Prisma } from "@/generated/prisma/client";
import { normalizeIranianPhone } from "@/lib/auth/phone";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";
import {
  getSalonDayBounds,
  getZonedWallTime,
  isSlotAligned,
  isWithinSalonHours,
  isValidCalendarDateString,
  parseCalendarDateString,
  zonedWallTimeToUtc,
} from "@/lib/time/salon-time";

const VALID_STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED"] as const;

const VALID_SORT_FIELDS = [
  "appointment",
  "createdAt",
  "customer",
  "service",
  "status",
] as const;

const VALID_SORT_DIRECTIONS = ["asc", "desc"] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];
type SortDirection = (typeof VALID_SORT_DIRECTIONS)[number];

function isBookingStatus(value: string): value is BookingStatus {
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]);
}

function isSortField(value: string): value is SortField {
  return VALID_SORT_FIELDS.includes(value as SortField);
}

function isSortDirection(value: string): value is SortDirection {
  return VALID_SORT_DIRECTIONS.includes(value as SortDirection);
}

function parseDateRange(fromDate: string | null, toDate: string | null) {
  let start: Date | undefined;
  let end: Date | undefined;

  if (fromDate) {
    if (!isValidCalendarDateString(fromDate)) {
      return {
        error: "تاریخ شروع معتبر نیست. از فرمت YYYY-MM-DD استفاده کنید.",
      };
    }

    const { year, month, day } = parseCalendarDateString(fromDate);
    start = zonedWallTimeToUtc(year, month, day, 0, 0, 0);
  }

  if (toDate) {
    if (!isValidCalendarDateString(toDate)) {
      return {
        error: "تاریخ پایان معتبر نیست. از فرمت YYYY-MM-DD استفاده کنید.",
      };
    }

    const { year, month, day } = parseCalendarDateString(toDate);
    end = zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0);
  }

  if (start && end && start >= end) {
    return {
      error: "تاریخ شروع باید قبل یا برابر با تاریخ پایان باشد.",
    };
  }

  return {
    start,
    end,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const search = searchParams.get("search")?.trim() || "";
    const sort = searchParams.get("sort") || "appointment";
    const direction = searchParams.get("direction") || "asc";
    const includePast = searchParams.get("includePast") === "true";

    if (status && !isBookingStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "وضعیت انتخابی معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (!isSortField(sort)) {
      return NextResponse.json(
        {
          success: false,
          message: "فیلد مرتب‌سازی معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (!isSortDirection(direction)) {
      return NextResponse.json(
        {
          success: false,
          message: "جهت مرتب‌سازی معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (search.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "متن جستجو نباید بیشتر از ۱۰۰ کاراکتر باشد.",
        },
        { status: 400 },
      );
    }

    const dateRange = parseDateRange(fromDate, toDate);

    if ("error" in dateRange) {
      return NextResponse.json(
        {
          success: false,
          message: dateRange.error,
        },
        { status: 400 },
      );
    }

    // By default, if no explicit fromDate is passed and includePast is false,
    // start from the beginning of today (Tehran time) into the future.
    let startFilter = dateRange.start;
    if (!startFilter && !fromDate && !includePast) {
      const wallNow = getZonedWallTime(new Date());
      startFilter = zonedWallTimeToUtc(
        wallNow.year,
        wallNow.month,
        wallNow.day,
        0,
        0,
        0,
      );
    }

    const where = {
      ...(status
        ? {
            status: status as BookingStatus,
          }
        : {}),
      ...(serviceId
        ? {
            serviceId,
          }
        : {}),
      ...(startFilter || dateRange.end
        ? {
            startsAt: {
              ...(startFilter ? { gte: startFilter } : {}),
              ...(dateRange.end ? { lt: dateRange.end } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            user: {
              OR: [
                {
                  fullName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  phoneNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
    };

    let orderBy:
      | { startsAt: SortDirection }
      | { createdAt: SortDirection }
      | { status: SortDirection }
      | { user: { fullName: SortDirection } }
      | { service: { name: SortDirection } };

    switch (sort) {
      case "createdAt":
        orderBy = {
          createdAt: direction,
        };
        break;

      case "customer":
        orderBy = {
          user: {
            fullName: direction,
          },
        };
        break;

      case "service":
        orderBy = {
          service: {
            name: direction,
          },
        };
        break;

      case "status":
        orderBy = {
          status: direction,
        };
        break;

      case "appointment":
      default:
        orderBy = {
          startsAt: direction,
        };
        break;
    }

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
    const limit = limitParam
      ? Math.min(100, Math.max(1, Number(limitParam)))
      : 12;
    const skip = (page - 1) * limit;

    const [totalCount, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              phoneNumber: true,
              fullName: true,
              birthDate: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              duration: true,
              isActive: true,
            },
          },
          payment: {
            select: {
              amount: true,
              status: true,
              refId: true,
            },
          },
        } as unknown as Prisma.BookingSelect,
      }),
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت لیست نوبت‌ها با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getSalonCalendarDayBounds(date: Date) {
  const wall = getZonedWallTime(date);
  const dateKey = `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
  return getSalonDayBounds(dateKey);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("clientName" in body) ||
      !("clientPhone" in body) ||
      !("serviceId" in body) ||
      !("startsAt" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات مشتری، سرویس و زمان نوبت الزامی است.",
        },
        { status: 400 },
      );
    }

    const {
      clientName,
      clientPhone,
      serviceId,
      startsAt: startsAtValue,
    } = body as {
      clientName: unknown;
      clientPhone: unknown;
      serviceId: unknown;
      startsAt: unknown;
    };

    if (typeof clientName !== "string" || !clientName.trim()) {
      return NextResponse.json(
        { success: false, message: "نام و نام خانوادگی مشتری الزامی است." },
        { status: 400 },
      );
    }

    if (typeof clientPhone !== "string" || !clientPhone.trim()) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن مشتری الزامی است." },
        { status: 400 },
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIranianPhone(clientPhone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن وارد شده معتبر نیست. مثال صحیح: ۰۹۱۲۳۴۵۶۷۸۹",
        },
        { status: 400 },
      );
    }

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        { success: false, message: "انتخاب سرویس الزامی است." },
        { status: 400 },
      );
    }

    if (typeof startsAtValue !== "string" || !startsAtValue) {
      return NextResponse.json(
        { success: false, message: "زمان شروع نوبت الزامی است." },
        { status: 400 },
      );
    }

    const startsAt = new Date(startsAtValue);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { success: false, message: "زمان شروع نوبت معتبر نیست." },
        { status: 400 },
      );
    }

    if (!isSlotAligned(startsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "نوبت‌ها باید در بازه‌های ۳۰ دقیقه‌ای ثبت شوند.",
        },
        { status: 400 },
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        duration: true,
        isActive: true,
        capacity: true,
        oneBookingPerDay: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: "سرویس مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    const endsAt = new Date(startsAt.getTime() + service.duration * 60 * 1000);

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان انتخابی در ساعات کاری سالن نمی‌گنجد.",
        },
        { status: 409 },
      );
    }

    const booking = await prisma.$transaction(
      async (tx) => {
        let user = await tx.user.findUnique({
          where: { phoneNumber: normalizedPhone },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              phoneNumber: normalizedPhone,
              fullName: clientName.trim(),
              role: "USER",
            },
          });
        } else if (!user.fullName) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { fullName: clientName.trim() },
          });
        }

        const { startOfDay, endOfDay } = getSalonCalendarDayBounds(startsAt);

        if (service.oneBookingPerDay) {
          const existingDailyBooking = await tx.booking.findFirst({
            where: {
              serviceId,
              status: "CONFIRMED",
              startsAt: { gte: startOfDay, lt: endOfDay },
            },
            select: { id: true },
          });

          if (existingDailyBooking) {
            throw new Error("SERVICE_BOOKING_PER_DAY_LIMIT");
          }
        }

        const overlappingBookingsCount = await tx.booking.count({
          where: {
            serviceId,
            status: "CONFIRMED",
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });

        if (overlappingBookingsCount >= service.capacity) {
          throw new Error("APPOINTMENT_UNAVAILABLE");
        }

        const overlappingBlockedTime = await tx.blockedTime.findFirst({
          where: {
            serviceId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        });

        if (overlappingBlockedTime) {
          throw new Error("APPOINTMENT_BLOCKED");
        }

        const existingSameServiceDay = await tx.booking.findFirst({
          where: {
            userId: user.id,
            serviceId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            startsAt: { gte: startOfDay, lt: endOfDay },
          },
          select: { id: true },
        });

        if (existingSameServiceDay) {
          throw new Error("DUPLICATE_SERVICE_DAY");
        }

        return tx.booking.create({
          data: {
            userId: user.id,
            serviceId,
            startsAt,
            endsAt,
            status: "CONFIRMED",
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    try {
      await smsProvider.sendBookingConfirmation({
        phoneNumber: normalizedPhone,
        userName: clientName.trim(),
        serviceName: booking.service.name,
        startsAt: booking.startsAt,
      });
    } catch (smsError) {
      console.error(
        "Booking confirmation SMS error (admin created):",
        smsError,
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "نوبت با موفقیت ثبت شد و پیامک تأیید برای مشتری ارسال گردید.",
        booking,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SERVICE_BOOKING_PER_DAY_LIMIT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "این خدمت برای این تاریخ قبلاً رزرو شده است و فقط یک نوبت در روز دارد.",
          },
          { status: 409 },
        );
      }
      if (error.message === "APPOINTMENT_UNAVAILABLE") {
        return NextResponse.json(
          { success: false, message: "ظرفیت این زمان تکمیل شده است." },
          { status: 409 },
        );
      }
      if (error.message === "APPOINTMENT_BLOCKED") {
        return NextResponse.json(
          { success: false, message: "این زمان برای این خدمت مسدود شده است." },
          { status: 409 },
        );
      }
      if (error.message === "DUPLICATE_SERVICE_DAY") {
        return NextResponse.json(
          {
            success: false,
            message:
              "برای این مشتری قبلاً در این تاریخ نوبتی از همین خدمت ثبت شده است.",
          },
          { status: 409 },
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "تداخل زمانی رخ داد. لطفاً زمان دیگری انتخاب کنید.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/admin/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "ثبت نوبت دستی با خطا مواجه شد." },
      { status: 500 },
    );
  }
}
