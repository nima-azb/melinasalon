import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const MAX_USERS = 200;

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_USERS,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            generations: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "دریافت لیست کاربران با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
