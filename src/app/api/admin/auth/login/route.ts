import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_EXPIRES_DAYS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { normalizeIranianPhone } from "@/lib/auth/phone";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function safePasswordCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(
      `admin-login:${getClientIp(request)}`,
      5,
      60_000,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً ۱ دقیقه صبر کنید.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const envAdminPassword = process.env.ADMIN_PASSWORD;

    if (!envAdminPassword) {
      console.error("ADMIN_PASSWORD environment variable is not configured.");
      return NextResponse.json(
        {
          success: false,
          message: "تنظیمات ورود مدیر کامل نیست.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body.password !== "string" ||
      body.password.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز عبور الزامی است.",
        },
        { status: 400 },
      );
    }

    if (!body.phone || typeof body.phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل مدیر الزامی است.",
        },
        { status: 400 },
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIranianPhone(body.phone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل نامعتبر است.",
        },
        { status: 400 },
      );
    }

    const isPasswordValid = safePasswordCompare(
      body.password,
      envAdminPassword,
    );

    const admin = await prisma.user.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        role: "ADMIN",
      },
    });

    if (!isPasswordValid || !admin) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل یا رمز عبور اشتباه است.",
        },
        { status: 401 },
      );
    }

    const sessionToken = await createSession({
      userId: admin.id,
      role: "ADMIN",
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * SESSION_EXPIRES_DAYS,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "ورود مدیر با موفقیت انجام شد.",
    });
  } catch (error) {
    console.error("POST /api/admin/auth/login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطایی هنگام ورود مدیر رخ داد.",
      },
      { status: 500 },
    );
  }
}
