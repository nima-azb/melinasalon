import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const { id } = await context.params;

    const blockedTime = await prisma.blockedTime.findUnique({
      where: {
        id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!blockedTime) {
      return NextResponse.json(
        {
          success: false,
          message: "زمان مسدود شده مورد نظر یافت نشد.",
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
      message: "زمان مسدود شده با موفقیت حذف شد.",
      blockedTime: {
        id: blockedTime.id,
        serviceId: blockedTime.serviceId,
        serviceName: blockedTime.service.name,
        startsAt: blockedTime.startsAt,
        endsAt: blockedTime.endsAt,
        reason: blockedTime.reason,
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/blocked-times/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حذف زمان مسدود شده با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
