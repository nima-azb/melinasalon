import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      Array<{ now: Date }>
    >`SELECT NOW() AS now`;

    return NextResponse.json({
      success: true,
      databaseTime: result[0]?.now ?? null,
    });
  } catch (error) {
    console.error("GET /api/test-db error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed.",
      },
      { status: 500 },
    );
  }
}
