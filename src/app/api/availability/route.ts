import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const OPENING_HOUR = 10;
const CLOSING_HOUR = 22;
const SLOT_INTERVAL_MINUTES = 30;

function createLocalDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export async function GET(request: NextRequest) {
  try {
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "فرمت تاریخ باید YYYY-MM-DD باشد.",
        },
        { status: 400 },
      );
    }

    const [year, month, day] = date.split("-").map(Number);

    const requestedDate = createLocalDateTime(year, month, day, 0, 0);

    if (
      requestedDate.getFullYear() !== year ||
      requestedDate.getMonth() !== month - 1 ||
      requestedDate.getDate() !== day
    ) {
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

    const startOfDay = createLocalDateTime(year, month, day, 0, 0);
    const endOfDay = createLocalDateTime(year, month, day + 1, 0, 0);

    const dayOpen = createLocalDateTime(year, month, day, OPENING_HOUR, 0);

    const dayClose = createLocalDateTime(year, month, day, CLOSING_HOUR, 0);

    const [bookings, blockedTimes] = await Promise.all([
      prisma.booking.findMany({
        where: {
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

      // The entire service must finish before or exactly at closing time.
      if (currentEnd > dayClose) {
        break;
      }

      const overlapsBooking = bookings.some((booking) =>
        intervalsOverlap(
          currentStart,
          currentEnd,
          booking.startsAt,
          booking.endsAt,
        ),
      );

      const overlapsBlockedTime = blockedTimes.some((blockedTime) =>
        intervalsOverlap(
          currentStart,
          currentEnd,
          blockedTime.startsAt,
          blockedTime.endsAt,
        ),
      );

      if (!overlapsBooking && !overlapsBlockedTime) {
        timeSlots.push({
          startsAt: new Date(currentStart),
          endsAt: currentEnd,
          available: true,
        });
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
