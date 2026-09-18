import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه زمان مسدودشده الزامی است.",
        },
        { status: 400 },
      );
    }

    const blockedTime = await prisma.blockedTime.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        reason: true,
      },
    });

    if (!blockedTime) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان مسدودشده یافت نشد.",
        },
        { status: 404 },
      );
    }

    await prisma.blockedTime.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      blockedTime,
    });
  } catch (error) {
    console.error("DELETE /api/admin/blocked-times/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حذف زمان مسدودشده با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
