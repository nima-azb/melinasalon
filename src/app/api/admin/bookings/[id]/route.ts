import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ["CANCELLED", "COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

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
          message: "A booking status is required.",
        },
        { status: 400 },
      );
    }

    const requestedStatus = body.status;

    if (requestedStatus !== "CANCELLED" && requestedStatus !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin can only cancel or complete a confirmed booking.",
        },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        userId: true,
        serviceId: true,
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

    const allowedStatuses = ALLOWED_TRANSITIONS[booking.status];

    if (!allowedStatuses.includes(requestedStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change booking from ${booking.status} to ${requestedStatus}.`,
        },
        { status: 409 },
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: requestedStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            fullName: true,
            birthDate: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isActive: true,
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
        message: "Failed to update booking.",
      },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking ID is required.",
        },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            fullName: true,
            birthDate: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isActive: true,
          },
        },
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

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("GET /api/admin/bookings/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load booking.",
      },
      { status: 500 },
    );
  }
}
