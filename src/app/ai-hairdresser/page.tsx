import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { AIHairdresserForm } from "@/components/ai-hairdresser/ai-hairdresser-form";
import { Footer } from "@/components/public/footer";
import { Navbar } from "@/components/public/navbar";
import {
  MAX_GENERATIONS,
  RATE_LIMIT_WINDOW_HOURS,
} from "@/lib/ai/check-generation-rate-limit";
import { hasEligibleBooking } from "@/lib/ai/has-eligible-booking";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";

export default async function AIHairdresserPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const [eligible, recentRequestCount] = await Promise.all([
    hasEligibleBooking(user.id),
    prisma.aiGenerationRequest.count({
      where: {
        userId: user.id,
        requestedAt: {
          gte: windowStart,
        },
      },
    }),
  ]);

  const remainingGenerations = Math.max(
    0,
    MAX_GENERATIONS - recentRequestCount,
  );

  return (
    <>
      <Navbar />

      <main className="w-full bg-[var(--bg-cream)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          {/* Hero */}
          <section className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium tracking-widest text-[var(--brand-crimson)] uppercase">
              <Sparkles size={14} />
              فناوری انحصاری ملینا
            </div>

            <h1 className="text-4xl leading-tight font-bold text-[var(--brand-crimson)] sm:text-5xl">
              آرایشگر هوش مصنوعی
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              ظاهر جدید خود را قبل از تغییر ببینید. با استفاده از هوش مصنوعی
              پیشرفته ما، مدل‌ها و رنگ‌های مختلف را روی چهره خود امتحان کنید و
              بهترین انتخاب را برای استایل بعدی خود داشته باشید.
            </p>
          </section>

          <AIHairdresserForm
            eligible={eligible}
            remainingGenerations={remainingGenerations}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
