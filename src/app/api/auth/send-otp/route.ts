import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  OTP_EXPIRY_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/constants";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/auth/otp";
import { normalizeIranianPhone } from "@/lib/auth/phone";
import { smsProvider } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل الزامی است.",
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
          message: "شماره موبایل وارد شده معتبر نیست.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    // Check resend cooldown.
    const latestRequest = await prisma.otpRequest.findFirst({
      where: {
        phoneNumber,
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    if (latestRequest) {
      const elapsedSeconds =
        (now.getTime() - latestRequest.requestedAt.getTime()) / 1000;

      if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds,
        );

        return NextResponse.json(
          {
            success: false,
            message: `لطفاً ${remainingSeconds} ثانیه دیگر دوباره تلاش کنید.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 },
        );
      }
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = getOtpExpiry();

    // Remove previous unused OTPs for this phone number.
    await prisma.otpCode.deleteMany({
      where: {
        phoneNumber,
      },
    });

    // Store the new OTP request and OTP code.
    await prisma.$transaction([
      prisma.otpRequest.create({
        data: {
          phoneNumber,
          requestedAt: now,
        },
      }),

      prisma.otpCode.create({
        data: {
          phoneNumber,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    // Development provider for now.
    // Later this will call MeliPayamak.
    await smsProvider.sendOtp(phoneNumber, otp);

    return NextResponse.json({
      success: true,
      message: "کد تأیید ارسال شد.",
      expiresIn: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطایی در ارسال کد تأیید رخ داد.",
      },
      { status: 500 },
    );
  }
}
