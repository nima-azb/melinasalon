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
        { success: false, message: "شماره تلفن و کد تأیید الزامی هستند." },
        { status: 400 },
      );
    }
    let phone: string;
    try {
      phone = normalizeIranianPhone(rawPhone);
    } catch {
      return NextResponse.json(
        { success: false, message: "شماره تلفن واردشده معتبر نیست." },
        { status: 400 },
      );
    }
    const purpose = requestedPurpose === "register" ? "REGISTER" : "LOGIN";
    const otpRecord = await prisma.otpCode.findFirst({
      where: { phoneNumber: phone, purpose },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "کد تأیید یافت نشد." },
        { status: 400 },
      );
    }
    if (isOtpExpired(otpRecord.expiresAt)) {
      await prisma.otpCode.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, message: "کد تأیید منقضی شده است." },
        { status: 400 },
      );
    }
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, message: "تعداد تلاش‌های تأیید بیش از حد مجاز است." },
        { status: 429 },
      );
    }
    const hashedCode = hashOtp(code);
    if (otpRecord.codeHash !== hashedCode) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { success: false, message: "کد تأیید واردشده نادرست است." },
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
              "اطلاعات ثبت‌نام ناقص است. لطفاً فرایند ثبت‌نام را دوباره شروع کنید.",
          },
          { status: 400 },
        );
      }
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: phone },
      });
      if (existingUser) {
        await prisma.otpCode.delete({ where: { id: otpRecord.id } });
        return NextResponse.json(
          {
            success: false,
            message:
              "حسابی با این شماره تلفن از قبل وجود دارد. لطفاً وارد حساب خود شوید.",
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
      user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
      if (!user) {
        await prisma.otpCode.delete({ where: { id: otpRecord.id } });
        return NextResponse.json(
          {
            success: false,
            message:
              "حسابی با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید.",
          },
          { status: 404 },
        );
      }
    }
    await prisma.otpCode.delete({ where: { id: otpRecord.id } });
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
          ? "ثبت‌نام با موفقیت انجام شد."
          : "ورود با موفقیت انجام شد.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "خطای داخلی سرور رخ داد." },
      { status: 500 },
    );
  }
}
