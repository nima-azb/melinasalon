import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";

const OPENING_HOUR = 10;
const CLOSING_HOUR = 22;
const SLOT_INTERVAL_MINUTES = 30;

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function isThirtyMinuteInterval(date: Date) {
  return (
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0 &&
    date.getMinutes() % SLOT_INTERVAL_MINUTES === 0
  );
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
            price: true,
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

    const body = await request.json();

    const { serviceId, startsAt } = body;

    if (typeof serviceId !== "string" || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Service ID is required.",
        },
        { status: 400 },
      );
    }

    if (typeof startsAt !== "string" || !startsAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking start time is required.",
        },
        { status: 400 },
      );
    }

    const parsedStartsAt = new Date(startsAt);

    if (Number.isNaN(parsedStartsAt.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking start time.",
        },
        { status: 400 },
      );
    }

    if (!isThirtyMinuteInterval(parsedStartsAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking times must use 30-minute intervals.",
        },
        { status: 400 },
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
        price: true,
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

    if (!Number.isInteger(service.duration) || service.duration <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This service has an invalid duration.",
        },
        { status: 500 },
      );
    }

    const endsAt = new Date(
      parsedStartsAt.getTime() + service.duration * 60 * 1000,
    );

    /*
     * Salon working hours:
     * 10:00 -> 22:00
     *
     * The complete service must fit inside this period.
     */
    const openingTime = new Date(parsedStartsAt);
    openingTime.setHours(OPENING_HOUR, 0, 0, 0);

    const closingTime = new Date(parsedStartsAt);
    closingTime.setHours(CLOSING_HOUR, 0, 0, 0);

    if (parsedStartsAt < openingTime || endsAt > closingTime) {
      return NextResponse.json(
        {
          success: false,
          message: "This booking time is outside salon working hours.",
        },
        { status: 409 },
      );
    }

    if (parsedStartsAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This booking time is no longer available.",
        },
        { status: 409 },
      );
    }

    /*
     * These boundaries are used only for checking whether
     * this user already booked the SAME SERVICE on this date.
     */
    const requestedDateStart = new Date(parsedStartsAt);
    requestedDateStart.setHours(0, 0, 0, 0);

    const requestedDateEnd = new Date(requestedDateStart);
    requestedDateEnd.setDate(requestedDateEnd.getDate() + 1);

    /*
     * Check availability and create the booking inside one
     * serializable transaction.
     *
     * This protects the booking flow when two requests arrive
     * at nearly the same time.
     */
    const booking = await prisma.$transaction(
      async (tx) => {
        const [existingBookings, blockedTimes, existingUserBooking] =
          await Promise.all([
            /*
             * Any confirmed booking that overlaps the requested
             * service period makes this time unavailable.
             */
            tx.booking.findMany({
              where: {
                status: "CONFIRMED",
                startsAt: {
                  lt: endsAt,
                },
                endsAt: {
                  gt: parsedStartsAt,
                },
              },
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
              },
            }),

            /*
             * Any admin-blocked period that overlaps the requested
             * service period makes this time unavailable.
             */
            tx.blockedTime.findMany({
              where: {
                startsAt: {
                  lt: endsAt,
                },
                endsAt: {
                  gt: parsedStartsAt,
                },
              },
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
              },
            }),

            /*
             * A user cannot book the SAME SERVICE twice on the
             * same calendar date.
             *
             * Different services on the same date are allowed.
             */
            tx.booking.findFirst({
              where: {
                userId: user.id,
                serviceId: service.id,
                status: "CONFIRMED",
                startsAt: {
                  lt: requestedDateEnd,
                },
                endsAt: {
                  gt: requestedDateStart,
                },
              },
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
              },
            }),
          ]);

        if (existingUserBooking) {
          throw new Error("USER_ALREADY_BOOKED_SERVICE_ON_DATE");
        }

        const overlapsBooking = existingBookings.some((existingBooking) =>
          intervalsOverlap(
            parsedStartsAt,
            endsAt,
            existingBooking.startsAt,
            existingBooking.endsAt,
          ),
        );

        if (overlapsBooking) {
          throw new Error("BOOKING_TIME_UNAVAILABLE");
        }

        const overlapsBlockedTime = blockedTimes.some((blockedTime) =>
          intervalsOverlap(
            parsedStartsAt,
            endsAt,
            blockedTime.startsAt,
            blockedTime.endsAt,
          ),
        );

        if (overlapsBlockedTime) {
          throw new Error("BOOKING_TIME_BLOCKED");
        }

        return tx.booking.create({
          data: {
            userId: user.id,
            serviceId: service.id,
            startsAt: parsedStartsAt,
            endsAt,
            status: "CONFIRMED",
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
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );

    /*
     * The booking is already confirmed at this point.
     * SMS failure must not undo the successful booking.
     */
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
    if (
      error instanceof Error &&
      error.message === "USER_ALREADY_BOOKED_SERVICE_ON_DATE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You already booked this service on this date.",
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "BOOKING_TIME_UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This time is no longer available.",
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "BOOKING_TIME_BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          message: "This time is blocked and cannot be booked.",
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
