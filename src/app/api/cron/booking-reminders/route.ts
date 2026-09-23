import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";
import {
  getSalonDayBounds,
  getZonedWallTime,
  zonedWallTimeToUtc,
} from "@/lib/time/salon-time";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Runs once a day through cPanel Cron (or another external scheduler).
 *
 * Finds every CONFIRMED booking that starts tomorrow in the salon's
 * local timezone and sends one reminder SMS per booking.
 *
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured; refusing to run booking-reminders.",
      );

      return NextResponse.json(
        {
          success: false,
          message: "Cron endpoint is not configured.",
        },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    /*
     * Calculate tomorrow using the salon's timezone.
     */
    const now = new Date();

    const todayWall = getZonedWallTime(now);

    const tomorrowInstant = zonedWallTimeToUtc(
      todayWall.year,
      todayWall.month,
      todayWall.day + 1,
      0,
      0,
      0,
    );

    const tomorrowWall = getZonedWallTime(tomorrowInstant);

    const tomorrowKey =
      `${tomorrowWall.year}-` +
      `${pad(tomorrowWall.month)}-` +
      `${pad(tomorrowWall.day)}`;

    const { startOfDay, endOfDay } = getSalonDayBounds(tomorrowKey);

    /*
     * Find confirmed bookings for tomorrow.
     *
     * `include` explicitly loads the related user and service records.
     */
    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSentAt: null,
        startsAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const booking of bookings) {
      try {
        await smsProvider.sendBookingReminder({
          phoneNumber: booking.user.phoneNumber,
          serviceName: booking.service.name,
          startsAt: booking.startsAt,
        });

        /*
         * Only mark the reminder as sent after the SMS provider
         * successfully completes.
         */
        await prisma.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            reminderSentAt: new Date(),
          },
        });

        sentCount += 1;
      } catch (smsError) {
        /*
         * A failed reminder must not prevent the remaining bookings
         * from being processed.
         */
        console.error(
          `Failed to send reminder for booking ${booking.id}:`,
          smsError,
        );

        failedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      date: tomorrowKey,
      totalBookings: bookings.length,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("GET /api/cron/booking-reminders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Booking reminder job failed.",
      },
      { status: 500 },
    );
  }
}
