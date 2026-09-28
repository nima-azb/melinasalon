import { NextResponse } from "next/server";

import { normalizeIranianPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن الزامی است.",
        },
        { status: 400 },
      );
    }

    let phoneNumber: string;

    try {
      phoneNumber = normalizeIranianPhone(body.phone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن واردشده معتبر نیست.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        phoneNumber,
      },
      select: {
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      isAdmin: user?.role === "ADMIN",
    });
  } catch (error) {
    console.error("POST /api/auth/check-phone error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطایی هنگام بررسی شماره تلفن رخ داد.",
      },
      { status: 500 },
    );
  }
}
