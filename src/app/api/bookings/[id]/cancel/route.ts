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
          message: "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: user.id,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        startsAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "نوبت مورد نظر یافت نشد یا امکان لغو آن وجود ندارد.",
        },
        { status: 404 },
      );
    }

    if (booking.startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "امکان لغو نوبتی که زمان آن سپری شده وجود ندارد.",
        },
        { status: 400 },
      );
    }

    const updatedBooking = await prisma.booking.update({
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/cancel error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "لغو نوبت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
