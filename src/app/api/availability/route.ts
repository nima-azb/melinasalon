import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required.",
        },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Date must be in YYYY-MM-DD format.",
        },
        { status: 400 },
      );
    }

    const [year, month, day] = date.split("-").map(Number);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        startsAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: {
        startsAt: "asc",
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

    const availableTimeSlots = timeSlots.map((timeSlot) => {
      const bookedCount = timeSlot.bookings.length;
      const remainingCapacity = Math.max(timeSlot.capacity - bookedCount, 0);

      return {
        id: timeSlot.id,
        startsAt: timeSlot.startsAt,
        endsAt: timeSlot.endsAt,
        capacity: timeSlot.capacity,
        bookedCount,
        remainingCapacity,
        available: remainingCapacity > 0,
      };
    });

    return NextResponse.json({
      success: true,
      date,
      timeSlots: availableTimeSlots,
    });
  } catch (error) {
    console.error("GET /api/availability error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load availability.",
      },
      { status: 500 },
    );
  }
}
