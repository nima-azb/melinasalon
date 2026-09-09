import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { hashOtp, isOtpExpired } from "@/lib/auth/otp";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { normalizeIranianPhone } from "@/lib/auth/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rawPhone = body?.phone;
    const code = body?.code;
    const requestedPurpose = body?.purpose;

    if (typeof rawPhone !== "string" || typeof code !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number and verification code are required.",
        },
        { status: 400 },
      );
    }

    let phone: string;

    try {
      phone = normalizeIranianPhone(rawPhone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The phone number is not valid.",
        },
        { status: 400 },
      );
    }

    const purpose = requestedPurpose === "register" ? "REGISTER" : "LOGIN";

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber: phone,
        purpose,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code was not found.",
        },
        { status: 400 },
      );
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await prisma.otpCode.delete({
        where: {
          id: otpRecord.id,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "The verification code has expired.",
        },
        { status: 400 },
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many verification attempts.",
        },
        { status: 429 },
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
          message: "Incorrect verification code.",
        },
        { status: 400 },
      );
    }

    let user;

    if (purpose === "REGISTER") {
      if (!otpRecord.fullName || !otpRecord.birthDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Registration information is incomplete. Please start registration again.",
          },
          { status: 400 },
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          phoneNumber: phone,
        },
      });

      if (existingUser) {
        await prisma.otpCode.delete({
          where: {
            id: otpRecord.id,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this phone number already exists. Please log in.",
          },
          { status: 409 },
        );
      }

      user = await prisma.user.create({
        data: {
          phoneNumber: phone,
          fullName: otpRecord.fullName,
          birthDate: otpRecord.birthDate,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: {
          phoneNumber: phone,
        },
      });

      if (!user) {
        await prisma.otpCode.delete({
          where: {
            id: otpRecord.id,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "No account was found for this phone number. Please register first.",
          },
          { status: 404 },
        );
      }
    }

    await prisma.otpCode.delete({
      where: {
        id: otpRecord.id,
      },
    });

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
      message:
        purpose === "REGISTER"
          ? "Registration completed successfully."
          : "Login successful.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred.",
      },
      { status: 500 },
    );
  }
}
