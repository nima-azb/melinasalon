import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/client";

const validStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

function isBookingStatus(value: string): value is BookingStatus {
  return validStatuses.includes(value as (typeof validStatuses)[number]);
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

    const where = {
      ...(status
        ? {
            status: status as BookingStatus,
          }
        : {}),
      ...(serviceId
        ? {
            serviceId,
          }
        : {}),
      ...(date
        ? (() => {
            const start = new Date(`${date}T00:00:00`);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            return {
              timeSlot: {
                startsAt: {
                  gte: start,
                  lt: end,
                },
              },
            };
          })()
        : {}),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        timeSlot: {
          startsAt: "asc",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
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
