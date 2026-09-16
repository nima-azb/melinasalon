import { DashboardShell } from "@/components/user/dashboard-shell";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { getArvanSignedReadUrl } from "@/lib/storage/arvan-upload";

const AI_GENERATION_LIMIT = 3;
const AI_WINDOW_HOURS = 24;

export default async function DashboardPage() {
  const user = await requireUser();

  const now = new Date();
  const aiWindowStart = new Date(
    now.getTime() - AI_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const [bookings, generations, recentAiRequests, confirmedBooking] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          startsAt: "asc",
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
            },
          },
        },
      }),

      prisma.generation.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          workflowType: true,
          originalPhotoUrl: true,
          resultPhotoUrl: true,
          styleChosen: true,
          createdAt: true,
        },
      }),

      prisma.aiGenerationRequest.count({
        where: {
          userId: user.id,
          requestedAt: {
            gte: aiWindowStart,
          },
        },
      }),

      prisma.booking.findFirst({
        where: {
          userId: user.id,
          status: "CONFIRMED",
          endsAt: {
            gte: now,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

  const generationsWithUrls = await Promise.all(
    generations.map(async (generation) => {
      const [originalUrl, resultUrl] = await Promise.all([
        getArvanSignedReadUrl(generation.originalPhotoUrl),
        getArvanSignedReadUrl(generation.resultPhotoUrl),
      ]);

      return {
        id: generation.id,
        workflowType: generation.workflowType,
        originalUrl,
        resultUrl,
        styleChosen: generation.styleChosen,
        createdAt: generation.createdAt.toISOString(),
      };
    }),
  );

  const remainingAiGenerations = Math.max(
    0,
    AI_GENERATION_LIMIT - recentAiRequests,
  );

  return (
    <DashboardShell
      user={{
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }}
      bookings={bookings.map((booking) => ({
        id: booking.id,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        service: booking.service,
      }))}
      generations={generationsWithUrls}
      stats={{
        bookingCount: bookings.length,
        generationCount: generations.length,
        remainingAiGenerations,
        hasEligibleAiBooking: confirmedBooking !== null,
      }}
    />
  );
}
