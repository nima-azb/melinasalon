import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import {
  isSlotAligned,
  isValidCalendarDateString,
  isWithinSalonHours,
  parseCalendarDateString,
  zonedWallTimeToUtc,
} from "@/lib/time/salon-time";

function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function buildSalonInstant(date: string, time: string): Date {
  const { year, month, day } = parseCalendarDateString(date);
  const [hour, minute] = time.split(":").map(Number);

  return zonedWallTimeToUtc(year, month, day, hour, minute, 0);
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

    if (date && !isValidCalendarDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ وارد شده معتبر نیست.",
        },
        { status: 400 },
      );
    }

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

    let startsAt: Date | undefined;
    let endsAt: Date | undefined;

    if (date) {
      const { year, month, day } = parseCalendarDateString(date);

      startsAt = zonedWallTimeToUtc(year, month, day, 0, 0, 0);
      endsAt = zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0);
    } else if (fromDate || toDate) {
      if (fromDate) {
        const { year, month, day } = parseCalendarDateString(fromDate);
        startsAt = zonedWallTimeToUtc(year, month, day, 0, 0, 0);
      }

      if (toDate) {
        const { year, month, day } = parseCalendarDateString(toDate);
        endsAt = zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0);
      }
    }

    const blockedTimes = await prisma.blockedTime.findMany({
      where: {
        ...(startsAt
          ? {
              endsAt: {
                gt: startsAt,
              },
            }
          : {}),
        ...(endsAt
          ? {
              startsAt: {
                lt: endsAt,
              },
            }
          : {}),
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        createdAt: true,
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
        message: "دریافت زمان‌های مسدودشده با خطا مواجه شد.",
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

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات ارسالی معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (!("date" in body) || !("startTime" in body) || !("endTime" in body)) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ، ساعت شروع و ساعت پایان الزامی است.",
        },
        { status: 400 },
      );
    }

    const date = body.date;
    const startTime = body.startTime;
    const endTime = body.endTime;

    const reason =
      "reason" in body && typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    if (
      typeof date !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ یا ساعت معتبر نیست.",
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

    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: "ساعت شروع یا پایان معتبر نیست.",
        },
        { status: 400 },
      );
    }

    const startsAt = buildSalonInstant(date, startTime);
    const endsAt = buildSalonInstant(date, endTime);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ یا ساعت معتبر نیست.",
        },
        { status: 400 },
      );
    }

    if (!isSlotAligned(startsAt) || !isSlotAligned(endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان‌های مسدودشده باید در بازه‌های ۳۰ دقیقه‌ای باشند.",
        },
        { status: 400 },
      );
    }

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "زمان مسدودشده باید کاملاً در ساعات کاری سالن (۱۰:۰۰ تا ۲۲:۰۰) باشد.",
        },
        { status: 400 },
      );
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "بازه مسدودشده باید در آینده باشد.",
        },
        { status: 400 },
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "توضیح نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.",
        },
        { status: 400 },
      );
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
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
            "این بازه با یک نوبت تایید‌شده تداخل دارد و قابل مسدود شدن نیست.",
        },
        { status: 409 },
      );
    }

    const overlappingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
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
          message: "این بازه با یک زمان مسدودشده دیگر تداخل دارد.",
        },
        { status: 409 },
      );
    }

    const blockedTime = await prisma.blockedTime.create({
      data: {
        startsAt,
        endsAt,
        reason: reason || null,
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        blockedTime,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/blocked-times error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ثبت زمان مسدودشده با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
