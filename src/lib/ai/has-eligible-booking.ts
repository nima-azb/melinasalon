import { prisma } from "@/lib/prisma";

export async function hasEligibleBooking(userId: string): Promise<boolean> {
  const booking = await prisma.booking.findFirst({
    where: {
      userId,
      status: "CONFIRMED",
    },
    select: {
      id: true,
    },
  });

  return booking !== null;
}
