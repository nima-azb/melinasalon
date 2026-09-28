import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_EXPIRES_DAYS } from "@/lib/auth/constants";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = "melina";

export async function POST(request: Request) {
  try {
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

    if (body.password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: "رمز عبور صحیح نیست.",
        },
        { status: 401 },
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "حساب مدیر در سیستم پیدا نشد.",
        },
        { status: 500 },
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
