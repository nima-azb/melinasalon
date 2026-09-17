import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_GENERATIONS = 3;
const RATE_LIMIT_WINDOW_HOURS = 24;
const MAX_SERIALIZATION_RETRIES = 3;

export type GenerationRateLimitResult =
  | {
      allowed: true;
      remaining: number;
      requestId: string;
    }
  | {
      allowed: false;
      remaining: 0;
      retryAfterSeconds: number;
    };

/**
 * Reserves one of the user's 3-per-24h AI generation slots.
 *
 * This MUST run at Serializable isolation. Without it, two requests fired at
 * nearly the same time (e.g. two browser tabs, or a double click) can both
 * read "2 of 3 slots used", both decide they're allowed, and both insert a
 * request row — silently letting the user exceed the limit. The booking
 * creation endpoint already guards against this exact class of race with
 * Serializable + a P2034 retry; this function previously did not, and is
 * fixed here to match.
 */
export async function reserveGenerationSlot(
  userId: string,
): Promise<GenerationRateLimitResult> {
  for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const now = new Date();

          const windowStart = new Date(
            now.getTime() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
          );

          const recentRequests = await tx.aiGenerationRequest.findMany({
            where: {
              userId,
              requestedAt: {
                gte: windowStart,
              },
            },
            orderBy: {
              requestedAt: "asc",
            },
          });

          if (recentRequests.length >= MAX_GENERATIONS) {
            const oldestRequest = recentRequests[0];

            const retryAt = new Date(
              oldestRequest.requestedAt.getTime() +
                RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
            );

            const retryAfterSeconds = Math.max(
              1,
              Math.ceil((retryAt.getTime() - now.getTime()) / 1000),
            );

            return {
              allowed: false,
              remaining: 0,
              retryAfterSeconds,
            };
          }

          const request = await tx.aiGenerationRequest.create({
            data: {
              userId,
            },
          });

          return {
            allowed: true,
            remaining: MAX_GENERATIONS - recentRequests.length - 1,
            requestId: request.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      const isLastAttempt = attempt === MAX_SERIALIZATION_RETRIES - 1;

      if (!isSerializationConflict || isLastAttempt) {
        throw error;
      }

      // Another concurrent request committed first; retry the transaction
      // so this request re-reads the up-to-date count.
    }
  }

  throw new Error("Failed to reserve AI generation slot after retries.");
}

export async function releaseGenerationSlot(requestId: string): Promise<void> {
  await prisma.aiGenerationRequest.delete({
    where: {
      id: requestId,
    },
  });
}
