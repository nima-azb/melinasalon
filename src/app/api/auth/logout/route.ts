import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "با موفقیت خارج شدید.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خروج از حساب با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}
