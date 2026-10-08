import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";

const DISCOUNT_PERCENT = 20;
const DISCOUNT_VALID_DAYS = 7;

function getJalaliDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

function generateDiscountCode(): string {
  const randomSuffix = randomBytes(3).toString("hex").toUpperCase();
  return `HBD-${randomSuffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured; refusing to run birthday greetings.",
      );
      return NextResponse.json(
        { success: false, message: "Cron endpoint is not configured." },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const now = new Date();
    const todayJalali = getJalaliDateParts(now);

    const eligibleUsers = await prisma.user.findMany({
      where: {
        birthDate: { not: null },
        OR: [
          { lastBirthdaySmsYear: null },
          { lastBirthdaySmsYear: { lt: todayJalali.year } },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        birthDate: true,
      },
    });

    const birthdayUsers = eligibleUsers.filter((user) => {
      if (!user.birthDate) {
        return false;
      }

      const userJalali = getJalaliDateParts(user.birthDate);

      if (
        userJalali.month === todayJalali.month &&
        userJalali.day === todayJalali.day
      ) {
        return true;
      }

      // Handle leap year birthdays (Esfand 30 in non-leap year on Esfand 29)
      if (
        userJalali.month === 12 &&
        userJalali.day === 30 &&
        todayJalali.month === 12 &&
        todayJalali.day === 29
      ) {
        return true;
      }

      return false;
    });

    let sentCount = 0;
    let failedCount = 0;

    const expiresAt = new Date(
      now.getTime() + DISCOUNT_VALID_DAYS * 24 * 60 * 60 * 1000,
    );

    for (const user of birthdayUsers) {
      try {
        const discountCode = generateDiscountCode();
        const clientName = user.fullName?.trim() || "کاربر عزیز";

        await prisma.$transaction([
          prisma.discountCode.create({
            data: {
              code: discountCode,
              userId: user.id,
              discountPercent: DISCOUNT_PERCENT,
              expiresAt,
            },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: {
              lastBirthdaySmsYear: todayJalali.year,
            },
          }),
        ]);

        await smsProvider.sendBirthdayGreeting({
          phoneNumber: user.phoneNumber,
          userName: clientName,
          discountCode,
          validDays: DISCOUNT_VALID_DAYS,
        });

        sentCount += 1;
      } catch (userError) {
        console.error(
          `Failed to process birthday greeting for user ${user.id}:`,
          userError,
        );
        failedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      date: `${todayJalali.year}/${todayJalali.month}/${todayJalali.day}`,
      totalBirthdayUsers: birthdayUsers.length,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("GET /api/cron/birthday-greetings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Birthday greetings job failed.",
      },
      { status: 500 },
    );
  }
}
