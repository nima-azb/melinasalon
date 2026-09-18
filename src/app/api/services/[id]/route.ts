import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateServiceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  duration: z.number().int().positive().max(480).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const service = await prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("GET /api/services/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت اطلاعات خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const body: unknown = await request.json();
    const result = updateServiceSchema.safeParse(body);

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

    const existingService = await prisma.service.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    const service = await prisma.service.update({
      where: {
        id,
      },
      data: {
        ...(result.data.name !== undefined
          ? {
              name: result.data.name,
            }
          : {}),
        ...(result.data.description !== undefined
          ? {
              description: result.data.description || null,
            }
          : {}),
        ...(result.data.duration !== undefined
          ? {
              duration: result.data.duration,
            }
          : {}),
        ...(result.data.isActive !== undefined
          ? {
              isActive: result.data.isActive,
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("PATCH /api/services/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ویرایش خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const existingService = await prisma.service.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "خدمت مورد نظر یافت نشد.",
        },
        { status: 404 },
      );
    }

    const bookingCount = await prisma.booking.count({
      where: {
        serviceId: id,
      },
    });

    if (bookingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "این خدمت دارای سابقه نوبت است و قابل حذف نیست. به‌جای حذف، آن را غیرفعال کنید.",
        },
        { status: 409 },
      );
    }

    await prisma.service.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "خدمت با موفقیت حذف شد.",
    });
  } catch (error) {
    console.error("DELETE /api/services/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حذف خدمت با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
