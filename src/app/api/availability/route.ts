import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  getConsumerServiceIds,
  getRequiredComponentServices,
  isSlotAvailable,
  parseServicePackages,
} from "@/lib/services/service-capacity";
import {
  SLOT_INTERVAL_MINUTES,
  getSalonDayBounds,
  isValidCalendarDateString,
} from "@/lib/time/salon-time";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(
      `availability:${getClientIp(request)}`,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "انتخاب سرویس الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!isValidCalendarDateString(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "تاریخ وارد شده معتبر نیست.",
        },
        { status: 400 },
      );
    }

    const packageId = searchParams.get("packageId");

    const allServices = await prisma.service.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        capacity: true,
        oneBookingPerDay: true,
        isActive: true,
        packages: true,
        linkedServiceIds: true,
      },
    });

    const targetService = allServices.find((s) => s.id === serviceId);

    if (!targetService) {
      return NextResponse.json(
        {
          success: false,
          message: "سرویس انتخاب شده موجود نیست.",
        },
        { status: 404 },
      );
    }

    const packages = parseServicePackages(targetService.packages);
    const selectedPkg = packages.find((p) => p.id === packageId);
    const effectiveDuration = selectedPkg?.duration || targetService.duration;

    const { startOfDay, endOfDay, dayOpen, dayClose } = getSalonDayBounds(date);

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const requiredComponents = getRequiredComponentServices(
      targetService,
      allServices,
    );
    const relevantServiceIds = new Set<string>();
    relevantServiceIds.add(targetService.id);
    for (const comp of requiredComponents) {
      const consumers = getConsumerServiceIds(comp.id, allServices);
      for (const c of consumers) {
        relevantServiceIds.add(c);
      }
    }

    const [bookings, pendingPayments, blockedTimes] = await Promise.all([
      prisma.booking.findMany({
        where: {
          serviceId: { in: Array.from(relevantServiceIds) },
          status: "CONFIRMED",
          startsAt: {
            lt: endOfDay,
          },
          endsAt: {
            gt: startOfDay,
          },
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
          serviceId: { in: Array.from(relevantServiceIds) },
          status: "PENDING",
          createdAt: {
            gte: fifteenMinutesAgo,
          },
          startsAt: {
            lt: endOfDay,
          },
          endsAt: {
            gt: startOfDay,
          },
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
          serviceId: { in: Array.from(relevantServiceIds) },
          startsAt: {
            lt: endOfDay,
          },
          endsAt: {
            gt: startOfDay,
          },
        },
        select: {
          id: true,
          serviceId: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const hasBookingForDay =
      (targetService.oneBookingPerDay ||
        requiredComponents.some((c) => c.oneBookingPerDay)) &&
      (bookings.length > 0 || pendingPayments.length > 0);

    const timeSlots: Array<{
      startsAt: Date;
      endsAt: Date;
      available: boolean;
    }> = [];

    let currentStart = new Date(dayOpen);

    while (currentStart < dayClose) {
      const currentEnd = new Date(
        currentStart.getTime() + effectiveDuration * 60 * 1000,
      );

      if (currentEnd > dayClose) {
        break;
      }

      if (currentStart > now && !hasBookingForDay) {
        const available = isSlotAvailable({
          targetService,
          allServices,
          bookings,
          pendingPayments,
          blockedTimes,
          slotStart: currentStart,
          slotEnd: currentEnd,
        });

        if (available) {
          timeSlots.push({
            startsAt: new Date(currentStart),
            endsAt: currentEnd,
            available: true,
          });
        }
      }

      currentStart = new Date(
        currentStart.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000,
      );
    }

    return NextResponse.json({
      success: true,
      date,
      service: {
        id: targetService.id,
        name: targetService.name,
        duration: effectiveDuration,
        capacity: targetService.capacity,
        oneBookingPerDay: targetService.oneBookingPerDay,
      },
      timeSlots,
    });
  } catch (error) {
    console.error("GET /api/availability error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت زمان‌های قابل رزرو.",
      },
      { status: 500 },
    );
  }
}
