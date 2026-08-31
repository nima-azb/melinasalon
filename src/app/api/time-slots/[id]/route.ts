import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createDateTime(date: string, time: string): Date | null {
  const value = new Date(`${date}T${time}:00`);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const { date, startsAt, endsAt, capacity } = body;

    if (
      date === undefined &&
      startsAt === undefined &&
      endsAt === undefined &&
      capacity === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field must be provided.",
        },
        { status: 400 },
      );
    }

    const existingSlot = await prisma.timeSlot.findUnique({
      where: {
        id,
      },
    });

    if (!existingSlot) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot not found.",
        },
        { status: 404 },
      );
    }

    const existingStart = existingSlot.startsAt;
    const existingEnd = existingSlot.endsAt;

    const existingDate = [
      existingStart.getFullYear(),
      String(existingStart.getMonth() + 1).padStart(2, "0"),
      String(existingStart.getDate()).padStart(2, "0"),
    ].join("-");

    const nextDate = date !== undefined ? date : existingDate;

    const nextStartTime =
      startsAt !== undefined
        ? startsAt
        : [
            String(existingStart.getHours()).padStart(2, "0"),
            String(existingStart.getMinutes()).padStart(2, "0"),
          ].join(":");

    const nextEndTime =
      endsAt !== undefined
        ? endsAt
        : [
            String(existingEnd.getHours()).padStart(2, "0"),
            String(existingEnd.getMinutes()).padStart(2, "0"),
          ].join(":");

    if (
      typeof nextDate !== "string" ||
      typeof nextStartTime !== "string" ||
      typeof nextEndTime !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, start time, and end time are required.",
        },
        { status: 400 },
      );
    }

    const nextStartsAt = createDateTime(nextDate, nextStartTime);

    const nextEndsAt = createDateTime(nextDate, nextEndTime);

    if (!nextStartsAt || !nextEndsAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date or time.",
        },
        { status: 400 },
      );
    }

    if (nextEndsAt <= nextStartsAt) {
      return NextResponse.json(
        {
          success: false,
          message: "End time must be after start time.",
        },
        { status: 400 },
      );
    }

    let nextCapacity = existingSlot.capacity;

    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);

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

      nextCapacity = parsedCapacity;
    }

    const conflictingSlot = await prisma.timeSlot.findFirst({
      where: {
        startsAt: nextStartsAt,
        NOT: {
          id,
        },
      },
    });

    if (conflictingSlot) {
      return NextResponse.json(
        {
          success: false,
          message: "A time slot already exists at this start time.",
        },
        { status: 409 },
      );
    }

    const timeSlot = await prisma.timeSlot.update({
      where: {
        id,
      },
      data: {
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        capacity: nextCapacity,
      },
    });

    return NextResponse.json({
      success: true,
      timeSlot,
    });
  } catch (error) {
    console.error("PATCH /api/time-slots/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update time slot.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot ID is required.",
        },
        { status: 400 },
      );
    }

    const existingSlot = await prisma.timeSlot.findUnique({
      where: {
        id,
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingSlot) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot not found.",
        },
        { status: 404 },
      );
    }

    if (existingSlot.bookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete a time slot with active bookings.",
        },
        { status: 409 },
      );
    }

    await prisma.timeSlot.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Time slot deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/time-slots/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete time slot.",
      },
      { status: 500 },
    );
  }
}
