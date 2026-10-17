import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  getConsumerServiceIds,
  getRequiredComponentServices,
  isSlotAvailable,
  parseServicePackages,
} from "@/lib/services/service-capacity";
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
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            refId: true,
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

    const {
      serviceId,
      startsAt: startsAtValue,
      packageName,
      price,
    } = body as {
      serviceId?: unknown;
      startsAt?: unknown;
      packageName?: unknown;
      price?: unknown;
    };

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

    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
        isActive: true,
        capacity: true,
        packages: true,
        linkedServiceIds: true,
        oneBookingPerDay: true,
      },
    });

    const service = allServices.find((s) => s.id === serviceId);

    if (!service) {
      return NextResponse.json(
        { success: false, message: "سرویس مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    const packages = parseServicePackages(service.packages);
    let effectiveDuration = service.duration;
    let finalPrice: number | null = service.price ?? null;
    let finalPackageName: string | null = null;

    if (typeof packageName === "string" && packageName.trim()) {
      const foundPkg = packages.find(
        (p) =>
          p.name.trim().toLowerCase() === packageName.trim().toLowerCase() ||
          p.id === packageName.trim(),
      );
      if (foundPkg) {
        finalPackageName = foundPkg.name;
        finalPrice = foundPkg.price;
        if (foundPkg.duration) {
          effectiveDuration = foundPkg.duration;
        }
      } else {
        finalPackageName = packageName.trim();
      }
    }

    if (typeof price === "number" && price >= 0) {
      finalPrice = price;
    }

    const endsAt = new Date(startsAt.getTime() + effectiveDuration * 60 * 1000);

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

        const requiredComponents = getRequiredComponentServices(
          service,
          allServices,
        );
        const relevantServiceIds = new Set<string>();
        relevantServiceIds.add(service.id);
        for (const comp of requiredComponents) {
          const consumers = getConsumerServiceIds(comp.id, allServices);
          for (const c of consumers) {
            relevantServiceIds.add(c);
          }
        }
        const relevantIdsList = Array.from(relevantServiceIds);

        if (
          service.oneBookingPerDay ||
          requiredComponents.some((c) => c.oneBookingPerDay)
        ) {
          const existingDailyBooking = await tx.booking.findFirst({
            where: {
              serviceId: { in: relevantIdsList },
              status: "CONFIRMED",
              startsAt: { gte: startOfDay, lt: endOfDay },
            },
            select: { id: true },
          });

          if (existingDailyBooking) {
            throw new Error("SERVICE_BOOKING_PER_DAY_LIMIT");
          }
        }

        const overlappingBookings = await tx.booking.findMany({
          where: {
            serviceId: { in: relevantIdsList },
            status: "CONFIRMED",
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: {
            id: true,
            serviceId: true,
            startsAt: true,
            endsAt: true,
          },
        });

        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const activePendingPayments = await tx.payment.findMany({
          where: {
            serviceId: { in: relevantIdsList },
            status: "PENDING",
            createdAt: { gte: fifteenMinutesAgo },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: {
            id: true,
            serviceId: true,
            startsAt: true,
            endsAt: true,
          },
        });

        const overlappingBlockedTimes = await tx.blockedTime.findMany({
          where: {
            serviceId: { in: relevantIdsList },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: {
            id: true,
            serviceId: true,
            startsAt: true,
            endsAt: true,
          },
        });

        const available = isSlotAvailable({
          targetService: service,
          allServices,
          bookings: overlappingBookings,
          pendingPayments: activePendingPayments,
          blockedTimes: overlappingBlockedTimes,
          slotStart: startsAt,
          slotEnd: endsAt,
        });

        if (!available) {
          const isDirectBlocked = overlappingBlockedTimes.some((b) =>
            relevantServiceIds.has(b.serviceId),
          );
          if (isDirectBlocked) {
            throw new Error("APPOINTMENT_BLOCKED");
          }
          throw new Error("APPOINTMENT_UNAVAILABLE");
        }

        const existingSameServiceDay = await tx.booking.findFirst({
          where: {
            userId: user.id,
            serviceId: { in: relevantIdsList },
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
            packageName: finalPackageName,
            price: finalPrice,
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
