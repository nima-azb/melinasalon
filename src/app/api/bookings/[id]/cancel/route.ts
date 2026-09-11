import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
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

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
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

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          message: "Only confirmed bookings can be cancelled.",
        },
        { status: 409 },
      );
    }

    if (booking.startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "A booking that has already started cannot be cancelled.",
        },
        { status: 409 },
      );
    }

    const cancelledBooking = await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "CANCELLED",
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
      },
    });

    return NextResponse.json({
      success: true,
      booking: cancelledBooking,
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/cancel error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel booking.",
      },
      { status: 500 },
    );
  }
}
