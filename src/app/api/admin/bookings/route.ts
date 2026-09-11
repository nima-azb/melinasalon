import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";

const VALID_STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED"] as const;

function isBookingStatus(value: string): value is BookingStatus {
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]);
}

function parseDateRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const start = new Date(`${date}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;

    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");

    if (status && !isBookingStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking status.",
        },
        { status: 400 },
      );
    }

    const where: {
      status?: BookingStatus;
      serviceId?: string;
      startsAt?: {
        gte: Date;
        lt: Date;
      };
    } = {};

    if (status) {
      where.status = status as BookingStatus;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (date) {
      const dateRange = parseDateRange(date);

      if (!dateRange) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid date. Use YYYY-MM-DD.",
          },
          { status: 400 },
        );
      }

      where.startsAt = {
        gte: dateRange.start,
        lt: dateRange.end,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        startsAt: "asc",
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
      bookings,
    });
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin bookings.",
      },
      { status: 500 },
    );
  }
}
