import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { PAYMENT_CONFIG } from "@/lib/payment/config";
import { requestPayment } from "@/lib/payment/zarinpal";
import { prisma } from "@/lib/prisma";
import {
  getConsumerServiceIds,
  getRequiredComponentServices,
  isSlotAvailable,
  parseServicePackages,
} from "@/lib/services/service-capacity";
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "برای ثبت نوبت و پرداخت باید وارد حساب کاربری خود شوید.",
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
          message: "انتخاب خدمت و زمان شروع نوبت الزامی است.",
        },
        { status: 400 },
      );
    }

    const serviceId = body.serviceId;
    const startsAtValue = body.startsAt;

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        { success: false, message: "انتخاب خدمت الزامی است." },
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
        { success: false, message: "خدمت مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    const { packageName } = body as { packageName?: unknown };
    const packages = parseServicePackages(service.packages);
    let effectiveDuration = service.duration;

    if (typeof packageName === "string" && packageName.trim()) {
      const foundPkg = packages.find(
        (p) =>
          p.name.trim().toLowerCase() === packageName.trim().toLowerCase() ||
          p.id === packageName.trim(),
      );
      if (foundPkg && foundPkg.duration) {
        effectiveDuration = foundPkg.duration;
      }
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

    // ۱. بررسی محدودیت یک نوبت در روز
    if (
      service.oneBookingPerDay ||
      requiredComponents.some((c) => c.oneBookingPerDay)
    ) {
      const existingDailyBooking = await prisma.booking.findFirst({
        where: {
          serviceId: { in: relevantIdsList },
          status: "CONFIRMED",
          startsAt: { gte: startOfDay, lt: endOfDay },
        },
        select: { id: true },
      });

      if (existingDailyBooking) {
        return NextResponse.json(
          {
            success: false,
            message:
              "این خدمت برای این تاریخ قبلاً رزرو شده است و فقط یک نوبت در روز دارد.",
          },
          { status: 409 },
        );
      }
    }

    // ۲. بررسی ظرفیت همزمان و مسدود بودن
    const [
      overlappingBookings,
      activePendingPayments,
      overlappingBlockedTimes,
    ] = await Promise.all([
      prisma.booking.findMany({
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
      }),
      prisma.payment.findMany({
        where: {
          serviceId: { in: relevantIdsList },
          status: "PENDING",
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        select: {
          id: true,
          serviceId: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.blockedTime.findMany({
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
      }),
    ]);

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
      const isBlocked = overlappingBlockedTimes.some((b) =>
        relevantServiceIds.has(b.serviceId),
      );
      return NextResponse.json(
        {
          success: false,
          message: isBlocked
            ? "این زمان برای این خدمت مسدود شده است."
            : "ظرفیت این زمان تکمیل شده یا کاربر دیگری هم‌اکنون در حال پرداخت این نوبت است.",
        },
        { status: 409 },
      );
    }

    // ۴. بررسی عدم رزرو تکراری کاربر در همان روز
    const existingSameServiceDay = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        serviceId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startsAt: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true },
    });

    if (existingSameServiceDay) {
      return NextResponse.json(
        {
          success: false,
          message: "شما قبلاً برای این خدمت در این تاریخ نوبت ثبت کرده‌اید.",
        },
        { status: 409 },
      );
    }

    // ۵. ایجاد درخواست در زرین‌پال
    const origin =
      request.nextUrl.origin && !request.nextUrl.origin.includes("0.0.0.0")
        ? request.nextUrl.origin
        : PAYMENT_CONFIG.appUrl;

    const callbackUrl = `${origin}/payment/result`;
    const amount = PAYMENT_CONFIG.depositAmountToman;
    const description = `بیعانه رزرو نوبت خدمت ${service.name} در سالن ملینا`;

    const paymentResult = await requestPayment({
      amount,
      description,
      callbackUrl,
      mobile: user.phoneNumber,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: paymentResult.error,
        },
        { status: 400 },
      );
    }

    // ۶. ذخیره رکورد تراکنش در دیتابیس
    await prisma.payment.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        amount,
        authority: paymentResult.authority,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      authority: paymentResult.authority,
    });
  } catch (error) {
    console.error("POST /api/payments/request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "شروع فرآیند پرداخت با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
      },
      { status: 500 },
    );
  }
}
