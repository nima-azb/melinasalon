import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  duration: z.number().int().positive().max(480),
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
