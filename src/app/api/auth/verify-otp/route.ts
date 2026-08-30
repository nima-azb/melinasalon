import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { hashOtp, isOtpExpired } from "@/lib/auth/otp";

import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

import { normalizeIranianPhone } from "@/lib/auth/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rawPhone = body.phone;
    const code = body.code;

    if (typeof rawPhone !== "string" || typeof code !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات وارد شده صحیح نیست.",
        },
        {
          status: 400,
        },
      );
    }

    const phone = normalizeIranianPhone(rawPhone);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber: phone,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "کد تایید یافت نشد.",
        },
        {
          status: 400,
        },
      );
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      return NextResponse.json(
        {
          success: false,
          message: "کد تایید منقضی شده است.",
        },
        {
          status: 400,
        },
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "تعداد تلاش‌ها بیش از حد مجاز است.",
        },
        {
          status: 429,
        },
      );
    }

    const hashedCode = hashOtp(code);

    if (otpRecord.codeHash !== hashedCode) {
      await prisma.otpCode.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "کد تایید اشتباه است.",
        },
        {
          status: 400,
        },
      );
    }

    // Delete used OTP after successful verification
    await prisma.otpCode.delete({
      where: {
        id: otpRecord.id,
      },
    });

    let user = await prisma.user.findUnique({
      where: {
        phoneNumber: phone,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: phone,
        },
      });
    }

    const sessionToken = await createSession({
      userId: user.id,
      role: user.role,
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "ورود موفق بود.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطای داخلی سرور.",
      },
      {
        status: 500,
      },
    );
  }
}
