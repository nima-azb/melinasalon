import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

const packageSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.number().int().nonnegative(),
  duration: z.number().int().positive().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  duration: z.number().int().positive().max(480),
  price: z.number().int().nonnegative().optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
  capacity: z.number().int().min(1).max(20).default(1),
  oneBookingPerDay: z.boolean().default(false),
  isActive: z.boolean().default(true),
  packages: z.array(packageSchema).optional().nullable(),
  linkedServiceIds: z.array(z.string().trim()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    if (includeInactive) {
      const admin = await requireAdmin();

      if (admin instanceof NextResponse) {
        return admin;
      }
    } else {
      const rateLimit = checkRateLimit(
        `services:${getClientIp(request)}`,
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
    }

    const services = await prisma.service.findMany({
      where: includeInactive
        ? undefined
        : {
            isActive: true,
          },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("GET /api/services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت خدمات با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const body: unknown = await request.json();

    const result = createServiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات خدمت معتبر نیست.",
          errors: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const service = await prisma.service.create({
      data: {
        name: result.data.name,
        description: result.data.description || null,
        duration: result.data.duration,
        price: result.data.price !== undefined ? result.data.price : null,
        imageUrl: result.data.imageUrl || null,
        capacity: result.data.capacity,
        oneBookingPerDay: result.data.oneBookingPerDay,
        isActive: result.data.isActive,
        packages: (result.data.packages ?? []) as Prisma.InputJsonValue,
        linkedServiceIds: result.data.linkedServiceIds ?? [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        service,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ثبت خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
