import { NextRequest, NextResponse } from "next/server";

import { BookingStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED"] as const;

const VALID_SORT_FIELDS = [
  "appointment",
  "createdAt",
  "customer",
  "service",
  "status",
] as const;

const VALID_SORT_DIRECTIONS = ["asc", "desc"] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];
type SortDirection = (typeof VALID_SORT_DIRECTIONS)[number];

function isBookingStatus(value: string): value is BookingStatus {
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]);
}

function isSortField(value: string): value is SortField {
  return VALID_SORT_FIELDS.includes(value as SortField);
}

function isSortDirection(value: string): value is SortDirection {
  return VALID_SORT_DIRECTIONS.includes(value as SortDirection);
}

function parseDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function parseDateRange(fromDate: string | null, toDate: string | null) {
  let start: Date | undefined;
  let end: Date | undefined;

  if (fromDate) {
    const parsedFromDate = parseDate(fromDate);

    if (!parsedFromDate) {
      return { error: "Invalid fromDate. Use YYYY-MM-DD." };
    }

    start = parsedFromDate;
  }

  if (toDate) {
    const parsedToDate = parseDate(toDate);

    if (!parsedToDate) {
      return { error: "Invalid toDate. Use YYYY-MM-DD." };
    }

    end = new Date(parsedToDate);
    end.setDate(end.getDate() + 1);
  }

  if (start && end && start >= end) {
    return {
      error: "fromDate must be earlier than or equal to toDate.",
    };
  }

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

    const search = searchParams.get("search")?.trim() ?? "";
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const sort = searchParams.get("sort") ?? "appointment";
    const direction = searchParams.get("direction") ?? "asc";

    if (status && !isBookingStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking status.",
        },
        { status: 400 },
      );
    }

    if (!isSortField(sort)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sort field.",
        },
        { status: 400 },
      );
    }

    if (!isSortDirection(direction)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sort direction.",
        },
        { status: 400 },
      );
    }

    if (search.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Search text cannot exceed 100 characters.",
        },
        { status: 400 },
      );
    }

    const dateRange = parseDateRange(fromDate, toDate);

    if ("error" in dateRange) {
      return NextResponse.json(
        {
          success: false,
          message: dateRange.error,
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
      ...(dateRange.start || dateRange.end
        ? {
            startsAt: {
              ...(dateRange.start ? { gte: dateRange.start } : {}),
              ...(dateRange.end ? { lt: dateRange.end } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            user: {
              OR: [
                {
                  fullName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  phoneNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
    };

    let orderBy:
      | { startsAt: SortDirection }
      | { createdAt: SortDirection }
      | { status: SortDirection }
      | { user: { fullName: SortDirection } }
      | { service: { name: SortDirection } };

    switch (sort) {
      case "createdAt":
        orderBy = {
          createdAt: direction,
        };
        break;

      case "customer":
        orderBy = {
          user: {
            fullName: direction,
          },
        };
        break;

      case "service":
        orderBy = {
          service: {
            name: direction,
          },
        };
        break;

      case "status":
        orderBy = {
          status: direction,
        };
        break;

      case "appointment":
      default:
        orderBy = {
          startsAt: direction,
        };
        break;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy,
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        updatedAt: true,
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
