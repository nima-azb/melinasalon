import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { verifySession, SESSION_COOKIE_NAME } from "./session";

/**
 * Returns the currently authenticated user.
 *
 * React cache() ensures multiple calls within the same request share
 * the same result.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  return user;
});
