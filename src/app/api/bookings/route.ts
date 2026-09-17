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

/**
 * Returns the [start, end) UTC bounds of the salon-local calendar day that
 * `date` falls on. Using `date.getFullYear()/getMonth()/getDate()` here (as
 * the previous implementation did) reads the SERVER's local timezone, not
 * the salon's, so on a server running in UTC a booking placed near midnight
 * Tehran time could be attributed to the wrong calendar day.
 */
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
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        startsAt: "asc",
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
      bookings,
    });
  } catch (error) {
    console.error("GET /api/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load bookings.",
      },
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
          message: "Authentication required.",
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
          message: "Service ID and appointment start time are required.",
        },
        { status: 400 },
      );
    }

    const serviceId = body.serviceId;
    const startsAtValue = body.startsAt;

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Service ID is required.",
        },
        { status: 400 },
      );
    }

    if (typeof startsAtValue !== "string" || !startsAtValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment start time is required.",
        },
        { status: 400 },
      );
    }

    if (!isValidDate(startsAtValue)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid appointment start time.",
        },
        { status: 400 },
      );
    }

    const startsAt = new Date(startsAtValue);

    if (!isSlotAligned(startsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointments must start on a 30-minute interval.",
        },
        { status: 400 },
      );
    }

    if (startsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This appointment time is no longer available.",
        },
        { status: 409 },
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found.",
        },
        { status: 404 },
      );
    }

    if (!service.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This service is not currently available.",
        },
        { status: 409 },
      );
    }

    const endsAt = new Date(startsAt.getTime() + service.duration * 60 * 1000);

    if (!isWithinSalonHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected appointment does not fit within salon working hours.",
        },
        { status: 409 },
      );
    }

    const booking = await prisma.$transaction(
      async (tx) => {
        const overlappingBooking = await tx.booking.findFirst({
          where: {
            status: "CONFIRMED",
            startsAt: {
              lt: endsAt,
            },
            endsAt: {
              gt: startsAt,
            },
          },
          select: {
            id: true,
          },
        });

        if (overlappingBooking) {
          throw new Error("APPOINTMENT_UNAVAILABLE");
        }

        const overlappingBlockedTime = await tx.blockedTime.findFirst({
          where: {
            startsAt: {
              lt: endsAt,
            },
            endsAt: {
              gt: startsAt,
            },
          },
          select: {
            id: true,
          },
        });

        if (overlappingBlockedTime) {
          throw new Error("APPOINTMENT_BLOCKED");
        }

        const { startOfDay, endOfDay } = getSalonCalendarDayBounds(startsAt);

        const existingSameServiceDay = await tx.booking.findFirst({
          where: {
            userId: user.id,
            serviceId,
            status: {
              in: ["CONFIRMED", "COMPLETED"],
            },
            startsAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          select: {
            id: true,
          },
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
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    try {
      await smsProvider.sendBookingConfirmation({
        phoneNumber: user.phoneNumber,
        serviceName: booking.service.name,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      });
    } catch (smsError) {
      console.error("Booking confirmation SMS error:", smsError);
    }

    return NextResponse.json(
      {
        success: true,
        booking,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "APPOINTMENT_UNAVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            message: "This appointment time is already booked.",
          },
          { status: 409 },
        );
      }

      if (error.message === "APPOINTMENT_BLOCKED") {
        return NextResponse.json(
          {
            success: false,
            message: "This appointment time is unavailable.",
          },
          { status: 409 },
        );
      }

      if (error.message === "DUPLICATE_SERVICE_DAY") {
        return NextResponse.json(
          {
            success: false,
            message:
              "You already have a booking for this service on this date.",
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
            "The appointment was booked by someone else. Please choose another time.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/bookings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking.",
      },
      { status: 500 },
    );
  }
}
