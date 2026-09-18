import { NextResponse } from "next/server";

import { getCurrentUser } from "./get-current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "برای ادامه باید وارد حساب کاربری خود شوید.",
      },
      { status: 401 },
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "این بخش فقط برای مدیران سالن قابل دسترسی است.",
      },
      { status: 403 },
    );
  }

  return user;
}
