import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { verifySession, SESSION_COOKIE_NAME } from "./session";

/**
 * Wrapped in React's cache() so multiple calls within the same request
 * (e.g. a page component and <Navbar /> both calling this) share one
 * result instead of each re-verifying the session cookie and re-querying
 * the database. This was previously happening on every admin, dashboard,
 * and ai-hairdresser page load.
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
