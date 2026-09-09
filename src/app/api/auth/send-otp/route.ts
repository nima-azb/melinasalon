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
          message: "Phone number is required.",
        },
        { status: 400 },
      );
    }

    const purpose = body.purpose === "register" ? "REGISTER" : "LOGIN";

    let phoneNumber: string;

    try {
      phoneNumber = normalizeIranianPhone(body.phone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The phone number is not valid.",
        },
        { status: 400 },
      );
    }

    let fullName: string | undefined;
    let birthDate: Date | undefined;

    if (purpose === "REGISTER") {
      if (typeof body.fullName !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Full name is required.",
          },
          { status: 400 },
        );
      }

      const trimmedFullName = body.fullName.trim();

      if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Full name must be between 2 and 100 characters.",
          },
          { status: 400 },
        );
      }

      fullName = trimmedFullName;

      if (typeof body.birthDate !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Birth date is required.",
          },
          { status: 400 },
        );
      }

      const parsedBirthDate = new Date(`${body.birthDate}T00:00:00.000Z`);

      if (Number.isNaN(parsedBirthDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Birth date is not valid.",
          },
          { status: 400 },
        );
      }

      if (parsedBirthDate > new Date()) {
        return NextResponse.json(
          {
            success: false,
            message: "Birth date cannot be in the future.",
          },
          { status: 400 },
        );
      }

      birthDate = parsedBirthDate;

      const existingUser = await prisma.user.findUnique({
        where: {
          phoneNumber,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this phone number already exists. Please log in.",
          },
          { status: 409 },
        );
      }
    }

    const now = new Date();

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
            message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 },
        );
      }
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await prisma.otpCode.deleteMany({
      where: {
        phoneNumber,
      },
    });

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
          purpose,
          fullName,
          birthDate,
        },
      }),
    ]);

    await smsProvider.sendOtp(phoneNumber, otp);

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully.",
      expiresIn: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while sending the verification code.",
      },
      { status: 500 },
    );
  }
}
