import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed.",
      },
      { status: 500 },
    );
  }
}
