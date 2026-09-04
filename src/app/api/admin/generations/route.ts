import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (admin instanceof NextResponse) {
      return admin;
    }

    const generations = await prisma.generation.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      generations,
    });
  } catch (error) {
    console.error("GET /api/admin/generations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin generations.",
      },
      { status: 500 },
    );
  }
}
