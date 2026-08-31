import { NextResponse } from "next/server";

import { getCurrentUser } from "./get-current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 },
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  return user;
}
