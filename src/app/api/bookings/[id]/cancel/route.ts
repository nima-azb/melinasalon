import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// حداقل فاصله زمانی مجاز برای لغو نوبت توسط کاربر به ساعت
const CANCELLATION_MIN_HOURS_NOTICE = 12;

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
        // مدیر می‌تواند هر نوبتی را لغو کند، کاربر عادی فقط نوبت‌های خودش
        ...(user.role === "ADMIN" ? {} : { userId: user.id }),
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
          message: "نوبت مورد نظر یافت نشد یا قبلاً لغو شده است.",
        },
        { status: 404 },
      );
    }

    const now = new Date();

    if (booking.startsAt <= now) {
      return NextResponse.json(
        {
          success: false,
          message: "امکان لغو نوبتی که زمان آن سپری شده وجود ندارد.",
        },
        { status: 400 },
      );
    }

    // کاربران عادی نمی‌توانند در کمتر از ۱۲ ساعت مانده به نوبت آن را لغو کنند
    if (user.role !== "ADMIN") {
      const hoursUntilAppointment =
        (booking.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < CANCELLATION_MIN_HOURS_NOTICE) {
        return NextResponse.json(
          {
            success: false,
            message: `امکان لغو آنلاین نوبت تنها تا ${CANCELLATION_MIN_HOURS_NOTICE} ساعت قبل از شروع نوبت وجود دارد. لطفاً جهت هماهنگی با سالن تماس بگیرید.`,
          },
          { status: 400 },
        );
      }
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
