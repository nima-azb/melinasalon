import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

function createDateTime(date: string, time: string): Date | null {
  const value = new Date(`${date}T${time}:00`);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
}

export async function GET() {
  try {
    await requireAdmin();

    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: {
        startsAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      timeSlots,
    });
  } catch (error) {
    console.error("GET /api/time-slots error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load time slots.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const { date, startsAt, endsAt, capacity } = body;

    if (
      typeof date !== "string" ||
      typeof startsAt !== "string" ||
      typeof endsAt !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, start time, and end time are required.",
        },
        { status: 400 },
      );
    }

    const startDate = createDateTime(date, startsAt);
    const endDate = createDateTime(date, endsAt);

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date or time.",
        },
        { status: 400 },
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "End time must be after start time.",
        },
        { status: 400 },
      );
    }

    const parsedCapacity = capacity === undefined ? 1 : Number(capacity);

    if (
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 1 ||
      parsedCapacity > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be an integer between 1 and 100.",
        },
        { status: 400 },
      );
    }

    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: {
        startsAt: startDate,
      },
    });

    if (existingTimeSlot) {
      return NextResponse.json(
        {
          success: false,
          message: "A time slot already exists at this start time.",
        },
        { status: 409 },
      );
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        startsAt: startDate,
        endsAt: endDate,
        capacity: parsedCapacity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        timeSlot,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/time-slots error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create time slot.",
      },
      { status: 500 },
    );
  }
}
