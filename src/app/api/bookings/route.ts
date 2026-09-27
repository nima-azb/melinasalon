import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";
import {
  getSalonDayBounds,
  getZonedWallTime,
  isSlotAligned,
  isWithinSalonHours,
} from "@/lib/time/salon-time";

function isValidDate(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getSalonCalendarDayBounds(date: Date) {
  const wall = getZonedWallTime(date);
  const dateKey = `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
  return getSalonDayBounds(dateKey);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "برای این عملیات باید وارد حساب کاربری خود شوید.",
        },
        { status: 401 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { startsAt: "asc" },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            oneBookingPerDay: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "دریافت نوبت‌ها با خطا مواجه شد." },
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
          message: "برای ثبت نوبت باید وارد حساب کاربری خود شوید.",
        },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("serviceId" in body) ||
      !("startsAt" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "انتخاب سرویس و زمان شروع نوبت الزامی است.",
        },
        { status: 400 },
      );
    }

    const serviceId = body.serviceId;
    const startsAtValue = body.startsAt;

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        { success: false, message: "انتخاب سرویس الزامی است." },
        { status: 400 },
      );
    }

    if (typeof startsAtValue !== "string" || !startsAtValue) {
      return NextResponse.json(
        { success: false, message: "زمان شروع نوبت الزامی است." },
        { status: 400 },
      );
    }

    if (!isValidDate(startsAtValue)) {
      return NextResponse.json(
        { success: false, message: "زمان شروع نوبت معتبر نیست." },
        { status: 400 },
      );
    }

    const startsAt = new Date(startsAtValue);

    if (!isSlotAligned(startsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "نوبت‌ها باید در بازه‌های ۳۰ دقیقه‌ای شروع شوند.",
        },
        { status: 400 },
      );
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        { success: false, message: "این زمان دیگر در دسترس نیست." },
        { status: 409 },
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        duration: true,
        isActive: true,
        capacity: true,
        oneBookingPerDay: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: "سرویس مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        { success: false, message: "این سرویس در حال حاضر فعال نیست." },
        { status: 409 },
      );
    }

    const endsAt = new Date(startsAt.getTime() + service.duration * 60 * 1000);

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان انتخابی در ساعات کاری سالن نمی‌گنجد.",
        },
        { status: 409 },
      );
    }

    const booking = await prisma.$transaction(
      async (tx) => {
        const { startOfDay, endOfDay } = getSalonCalendarDayBounds(startsAt);

        if (service.oneBookingPerDay) {
          const existingDailyBooking = await tx.booking.findFirst({
            where: {
              serviceId,
              status: "CONFIRMED",
              startsAt: { gte: startOfDay, lt: endOfDay },
            },
            select: { id: true },
          });

          if (existingDailyBooking) {
            throw new Error("SERVICE_BOOKING_PER_DAY_LIMIT");
          }
        }

        const overlappingBookingsCount = await tx.booking.count({
          where: {
            serviceId,
            status: "CONFIRMED",
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });

        if (overlappingBookingsCount >= service.capacity) {
          throw new Error("APPOINTMENT_UNAVAILABLE");
        }

        const overlappingBlockedTime = await tx.blockedTime.findFirst({
          where: {
            serviceId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        });

        if (overlappingBlockedTime) {
          throw new Error("APPOINTMENT_BLOCKED");
        }

        const existingSameServiceDay = await tx.booking.findFirst({
          where: {
            userId: user.id,
            serviceId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            startsAt: { gte: startOfDay, lt: endOfDay },
          },
          select: { id: true },
        });

        if (existingSameServiceDay) {
          throw new Error("DUPLICATE_SERVICE_DAY");
        }

        return tx.booking.create({
          data: {
            userId: user.id,
            serviceId,
            startsAt,
            endsAt,
            status: "CONFIRMED",
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                oneBookingPerDay: true,
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    try {
      const clientName =
        (user as { fullName?: string | null }).fullName || "کاربر";

      await smsProvider.sendBookingConfirmation({
        phoneNumber: user.phoneNumber,
        userName: clientName,
        serviceName: booking.service.name,
        startsAt: booking.startsAt,
      });
    } catch (smsError) {
      console.error("Booking confirmation SMS error:", smsError);
    }

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SERVICE_BOOKING_PER_DAY_LIMIT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "این خدمت برای این تاریخ قبلاً رزرو شده است و فقط یک نوبت در روز دارد.",
          },
          { status: 409 },
        );
      }
      if (error.message === "APPOINTMENT_UNAVAILABLE") {
        return NextResponse.json(
          { success: false, message: "ظرفیت این زمان تکمیل شده است." },
          { status: 409 },
        );
      }
      if (error.message === "APPOINTMENT_BLOCKED") {
        return NextResponse.json(
          { success: false, message: "این زمان برای این خدمت مسدود شده است." },
          { status: 409 },
        );
      }
      if (error.message === "DUPLICATE_SERVICE_DAY") {
        return NextResponse.json(
          {
            success: false,
            message: "شما قبلاً برای این سرویس در این تاریخ نوبت ثبت کرده‌اید.",
          },
          { status: 409 },
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "این نوبت توسط شخص دیگری ثبت شد. لطفاً زمان دیگری انتخاب کنید.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "ثبت نوبت با خطا مواجه شد." },
      { status: 500 },
    );
  }
}
