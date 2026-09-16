import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const SALON_START_HOUR = 10;
const SALON_END_HOUR = 22;
const SLOT_INTERVAL_MINUTES = 30;

function createLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function isValidSlotInterval(date: Date) {
  return (
    date.getMinutes() % SLOT_INTERVAL_MINUTES === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

function isWithinSalonHours(start: Date, end: Date) {
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return (
    startMinutes >= SALON_START_HOUR * 60 &&
    endMinutes <= SALON_END_HOUR * 60 &&
    end > start
  );
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

    if (date && !isValidDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date.",
        },
        { status: 400 },
      );
    }

    if (fromDate && !isValidDateString(fromDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid fromDate.",
        },
        { status: 400 },
      );
    }

    if (toDate && !isValidDateString(toDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid toDate.",
        },
        { status: 400 },
      );
    }

    let startsAt: Date | undefined;
    let endsAt: Date | undefined;

    if (date) {
      const [year, month, day] = date.split("-").map(Number);

      startsAt = new Date(year, month - 1, day);
      endsAt = new Date(year, month - 1, day + 1);
    } else if (fromDate || toDate) {
      if (fromDate) {
        const [year, month, day] = fromDate.split("-").map(Number);
        startsAt = new Date(year, month - 1, day);
      }

      if (toDate) {
        const [year, month, day] = toDate.split("-").map(Number);
        endsAt = new Date(year, month - 1, day + 1);
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
        message: "Failed to load blocked times.",
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
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    if (!("date" in body) || !("startTime" in body) || !("endTime" in body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, start time, and end time are required.",
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
          message: "Invalid date or time.",
        },
        { status: 400 },
      );
    }

    if (!isValidDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date.",
        },
        { status: 400 },
      );
    }

    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid start or end time.",
        },
        { status: 400 },
      );
    }

    const startsAt = createLocalDateTime(date, startTime);
    const endsAt = createLocalDateTime(date, endTime);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date or time.",
        },
        { status: 400 },
      );
    }

    if (!isValidSlotInterval(startsAt) || !isValidSlotInterval(endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "Blocked times must use 30-minute intervals.",
        },
        { status: 400 },
      );
    }

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Blocked time must be completely within salon working hours (10:00–22:00).",
        },
        { status: 400 },
      );
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "A blocked period must be in the future.",
        },
        { status: 400 },
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Reason cannot exceed 500 characters.",
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
            "This period overlaps an existing confirmed booking and cannot be blocked.",
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
          message: "This period overlaps an existing blocked period.",
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
        message: "Failed to create blocked time.",
      },
      { status: 500 },
    );
  }
}
