import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        timeSlot: {
          startsAt: "asc",
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            capacity: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load bookings.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { serviceId, timeSlotId } = body;

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Service ID is required.",
        },
        { status: 400 },
      );
    }

    if (typeof timeSlotId !== "string" || !timeSlotId) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot ID is required.",
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
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found.",
        },
        { status: 404 },
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This service is not currently available.",
        },
        { status: 409 },
      );
    }

    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: timeSlotId,
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        {
          success: false,
          message: "Time slot not found.",
        },
        { status: 404 },
      );
    }

    if (timeSlot.startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This time slot is no longer available.",
        },
        { status: 409 },
      );
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        timeSlotId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a booking for this time slot.",
        },
        { status: 409 },
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const bookedCount = await tx.booking.count({
        where: {
          timeSlotId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      });

      if (bookedCount >= timeSlot.capacity) {
        throw new Error("TIME_SLOT_FULL");
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          serviceId,
          timeSlotId,
          status: "PENDING",
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          timeSlot: {
            select: {
              id: true,
              startsAt: true,
              endsAt: true,
              capacity: true,
            },
          },
        },
      });
    });

    // Development booking confirmation SMS.
    // SMS failures must not cancel an already-created booking.
    try {
      await smsProvider.sendBookingConfirmation({
        phoneNumber: user.phoneNumber,
        serviceName: booking.service.name,
        startsAt: booking.timeSlot.startsAt,
        endsAt: booking.timeSlot.endsAt,
        status: booking.status,
      });
    } catch (smsError) {
      console.error("Booking confirmation SMS error:", smsError);
    }

    return NextResponse.json(
      {
        success: true,
        booking,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "TIME_SLOT_FULL") {
      return NextResponse.json(
        {
          success: false,
          message: "This time slot is fully booked.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking.",
      },
      { status: 500 },
    );
  }
}
