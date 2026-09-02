import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is required.",
        },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      typeof body.status !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid booking status is required.",
        },
        { status: 400 },
      );
    }

    const newStatus = body.status as BookingStatus;

    if (!Object.values(BookingStatus).includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking status.",
        },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 },
      );
    }

    if (!allowedTransitions[booking.status].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "This booking status transition is not allowed.",
        },
        { status: 409 },
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
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
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("PATCH /api/admin/bookings/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update booking status.",
      },
      { status: 500 },
    );
  }
}
