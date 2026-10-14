import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const workflowType = searchParams.get("workflowType");

    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
    const limit = limitParam
      ? Math.min(100, Math.max(1, Number(limitParam)))
      : 12;
    const skip = (page - 1) * limit;

    const where = {
      ...(workflowType === "CUSTOM" || workflowType === "RECOMMENDATION"
        ? { workflowType: workflowType as "CUSTOM" | "RECOMMENDATION" }
        : {}),
    };

    const [totalCount, generations] = await Promise.all([
      prisma.generation.count({ where }),
      prisma.generation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      generations,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("GET /api/admin/generations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت تصاویر هوش مصنوعی با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
