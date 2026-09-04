import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,

  // Keep the application pool small and predictable.
  // This is especially useful during Next.js development
  // where hot reload can otherwise create/reuse connections
  // in unexpected ways.
  max: 5,

  // Close connections that have been idle for a while.
  idleTimeoutMillis: 30_000,

  // Fail reasonably quickly instead of hanging for a long time.
  connectionTimeoutMillis: 10_000,
});

export const prisma = new PrismaClient({
  adapter,
});
