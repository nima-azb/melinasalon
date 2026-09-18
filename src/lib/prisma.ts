import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

/**
 * In Next.js development, this module is re-evaluated on every hot reload
 * (especially noticeable with Turbopack). Without caching the client here,
 * each reload created a brand new PrismaClient AND a brand new pg connection
 * pool (up to 5 connections each, per the adapter config below) — while the
 * previous one was never explicitly closed. Over a normal dev session this
 * silently accumulates far more open connections to the database than
 * Neon's connection limit allows, and once that limit is hit Neon starts
 * dropping connections outright, surfacing as
 * "PrismaClientKnownRequestError: Server has closed the connection."
 *
 * Caching the client on `globalThis` avoids this: `globalThis` survives
 * module hot-reloads (only the module cache is reset), so the same
 * PrismaClient/pool is reused across reloads instead of piling up.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString,

    // Keep the application pool small and predictable.
    max: 5,

    // Close connections that have been idle for a while.
    idleTimeoutMillis: 30_000,

    // Fail reasonably quickly instead of hanging for a long time.
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
