import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const packageSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "نام پکیج الزامی است."),
  price: z.coerce.number().int().nonnegative("مبلغ پکیج نمی‌تواند منفی باشد."),
  duration: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined || Number(val) <= 0
        ? null
        : Number(val),
    z.number().int().positive().nullable().optional(),
  ),
  description: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().optional().nullable(),
  ),
});

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "نام خدمت الزامی است.").max(100),
  description: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(1000).optional().nullable(),
  ),
  duration: z.coerce
    .number()
    .int()
    .positive("مدت زمان خدمت باید بیشتر از صفر باشد.")
    .max(480),
  price: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z
      .number()
      .int()
      .nonnegative("مبلغ خدمت نمی‌تواند منفی باشد.")
      .optional()
      .nullable(),
  ),
  imageUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().trim().max(1000).optional().nullable(),
  ),
  capacity: z.coerce.number().int().min(1).max(20).default(1),
  oneBookingPerDay: z.boolean().default(false),
  isActive: z.boolean().default(true),
  packages: z.array(packageSchema).optional().nullable().default([]),
  linkedServiceIds: z.array(z.string().trim()).optional().default([]),
});

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const services = await prisma.service.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("GET /api/admin/services error:", error);

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
      const flattened = result.error.flatten();
      const firstError =
        Object.values(flattened.fieldErrors)[0]?.[0] ||
        flattened.formErrors[0] ||
        "اطلاعات خدمت معتبر نیست.";

      return NextResponse.json(
        {
          success: false,
          message: firstError,
          errors: flattened,
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
    console.error("POST /api/admin/services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ثبت خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
