import { DashboardShell } from "@/components/user/dashboard-shell";
import { Footer } from "@/components/public/footer";
import { Navbar } from "@/components/public/navbar";
import {
  MAX_GENERATIONS as AI_GENERATION_LIMIT,
  RATE_LIMIT_WINDOW_HOURS as AI_WINDOW_HOURS,
} from "@/lib/ai/check-generation-rate-limit";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { getArvanSignedReadUrl } from "@/lib/storage/arvan-upload";

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

  const activeBookings = bookings.filter(
    (booking) => booking.status === "CONFIRMED" && booking.startsAt >= now,
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "COMPLETED",
  );

  const nextBooking = activeBookings[0]
    ? {
        serviceName: activeBookings[0].service.name,
        startsAt: activeBookings[0].startsAt.toISOString(),
      }
    : null;

  return (
    <>
      <Navbar />

      <main className="w-full bg-[var(--bg-cream)]">
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
            activeBookingsCount: activeBookings.length,
            completedVisitsCount: completedBookings.length,
            generationCount: generations.length,
            remainingAiGenerations,
            hasEligibleAiBooking: confirmedBooking !== null,
            nextBooking,
          }}
        />
      </main>

      <Footer />
    </>
  );
}
