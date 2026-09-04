import { prisma } from "@/lib/prisma";

const MAX_GENERATIONS = 3;
const RATE_LIMIT_WINDOW_HOURS = 24;

export type GenerationRateLimitResult =
  | {
      allowed: true;
      remaining: number;
    }
  | {
      allowed: false;
      remaining: 0;
      retryAfterSeconds: number;
    };

export async function reserveGenerationSlot(
  userId: string,
): Promise<GenerationRateLimitResult> {
  return prisma.$transaction(async (tx) => {
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

    await tx.aiGenerationRequest.create({
      data: {
        userId,
      },
    });

    return {
      allowed: true,
      remaining: MAX_GENERATIONS - recentRequests.length - 1,
    };
  });
}
