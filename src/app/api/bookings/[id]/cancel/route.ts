import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
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

    const booking = await prisma.booking.updateMany({
      where: {
        id,
        userId: user.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (booking.count === 0) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          id,
          userId: user.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existingBooking) {
        return NextResponse.json(
          {
            success: false,
            message: "Booking not found.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "This booking cannot be cancelled.",
        },
        { status: 409 },
      );
    }

    const cancelledBooking = await prisma.booking.findUnique({
      where: {
        id,
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
