import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  SLOT_INTERVAL_MINUTES,
  getSalonDayBounds,
  isValidCalendarDateString,
} from "@/lib/time/salon-time";

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

      // A slot that has already started (or is in the past) can never be
      // booked. Without this check, "today" always listed every slot as
      // available and the customer only discovered it was unbookable after
      // submitting the booking and receiving a 409 from POST /api/bookings.
      if (currentStart > now) {
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
