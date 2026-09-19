import { NextResponse } from "next/server";

import { BookingStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  SALON_TIMEZONE,
  getSalonDayBounds,
  getZonedWallTime,
} from "@/lib/time/salon-time";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

const WEEKDAY_ORDER = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const WEEKDAY_LABELS: Record<string, string> = {
  Sat: "شنبه",
  Sun: "یک",
  Mon: "دو",
  Tue: "سه",
  Wed: "چهار",
  Thu: "پنج",
  Fri: "جمعه",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getShortWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    weekday: "short",
  }).format(date);
}

/** Percent change from `previous` to `current`, or null when not meaningful. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const now = new Date();
    const todayWall = getZonedWallTime(now);
    const todayKey = toDateKey(todayWall.year, todayWall.month, todayWall.day);

    const today = getSalonDayBounds(todayKey);

    const yesterdayDate = new Date(
      today.startOfDay.getTime() - 24 * 60 * 60 * 1000,
    );
    const yesterdayWall = getZonedWallTime(yesterdayDate);
    const yesterday = getSalonDayBounds(
      toDateKey(yesterdayWall.year, yesterdayWall.month, yesterdayWall.day),
    );

    // Sat-through-Fri salon week containing "today".
    const todayWeekdayIndex = WEEKDAY_ORDER.indexOf(getShortWeekday(now));

    const weekDayKeys = Array.from({ length: 7 }, (_, index) => {
      const { year, month, day } = todayWall;
      const offset = index - todayWeekdayIndex;
      const bounds = getSalonDayBounds(toDateKey(year, month, day + offset));
      return {
        key: toDateKey(year, month, day + offset),
        isToday: offset === 0,
        ...bounds,
      };
    });

    const weekStart = weekDayKeys[0].startOfDay;
    const weekEnd = weekDayKeys[6].endOfDay;

    const previousWeekStart = new Date(
      weekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const [
      todayCount,
      yesterdayCount,
      newUsersThisWeek,
      newUsersPreviousWeek,
      totalUsers,
      totalGenerations,
      usersWithGeneration,
      weekBookings,
      upcomingBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          startsAt: { gte: today.startOfDay, lt: today.endOfDay },
        },
      }),
      prisma.booking.count({
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          startsAt: { gte: yesterday.startOfDay, lt: yesterday.endOfDay },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekStart, lt: weekEnd } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: previousWeekStart, lt: weekStart } },
      }),
      prisma.user.count(),
      prisma.generation.count(),
      prisma.user.findMany({
        where: { generations: { some: {} } },
        select: {
          id: true,
          bookings: {
            where: { status: { in: ACTIVE_BOOKING_STATUSES } },
            select: { id: true },
            take: 1,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          startsAt: { gte: weekStart, lt: weekEnd },
        },
        select: { startsAt: true },
      }),
      prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          startsAt: { gte: now, lt: today.endOfDay },
        },
        orderBy: { startsAt: "asc" },
        take: 5,
        select: {
          id: true,
          startsAt: true,
          user: { select: { fullName: true, phoneNumber: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    const usersWithGenerationCount = usersWithGeneration.length;
    const usersWithGenerationAndBooking = usersWithGeneration.filter(
      (user) => user.bookings.length > 0,
    ).length;

    const aiConversionRate =
      usersWithGenerationCount === 0
        ? null
        : Math.round(
            (usersWithGenerationAndBooking / usersWithGenerationCount) * 100,
          );

    const weeklyBookingChart = weekDayKeys.map((day) => ({
      label: WEEKDAY_LABELS[getShortWeekday(day.startOfDay)] ?? day.key,
      isToday: day.isToday,
      count: weekBookings.filter(
        (booking) =>
          booking.startsAt >= day.startOfDay && booking.startsAt < day.endOfDay,
      ).length,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        todayBookings: {
          count: todayCount,
          changePercent: percentChange(todayCount, yesterdayCount),
        },
        newUsers: {
          count: newUsersThisWeek,
          changePercent: percentChange(newUsersThisWeek, newUsersPreviousWeek),
        },
        totalUsers,
        aiGenerations: {
          total: totalGenerations,
          conversionRate: aiConversionRate,
        },
      },
      weeklyBookingChart,
      upcomingBookings: upcomingBookings.map((booking) => ({
        id: booking.id,
        customerName: booking.user.fullName || booking.user.phoneNumber,
        serviceName: booking.service.name,
        startsAt: booking.startsAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/overview error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت آمار داشبورد با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
