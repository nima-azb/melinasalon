import { NextRequest, NextResponse } from "next/server";

import { normalizeIranianPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(
      `check-phone:${getClientIp(request)}`,
      15,
      60_000,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید.",
        },
        { status: 429 },
      );
    }

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
