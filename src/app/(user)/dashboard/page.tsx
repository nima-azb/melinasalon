import { LogoutButton } from "@/components/auth/logout-button";
import { MyBookings } from "@/components/user/my-bookings";
import { MyGenerations } from "@/components/user/my-generations";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { getArvanSignedReadUrl } from "@/lib/storage/arvan-upload";

export default async function DashboardPage() {
  const user = await requireUser();

  const generations = await prisma.generation.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      originalPhotoUrl: true,
      resultPhotoUrl: true,
      styleChosen: true,
      createdAt: true,
    },
  });

  const generationsWithUrls = await Promise.all(
    generations.map(async (generation) => {
      const [originalUrl, resultUrl] = await Promise.all([
        getArvanSignedReadUrl(generation.originalPhotoUrl),
        getArvanSignedReadUrl(generation.resultPhotoUrl),
      ]);

      return {
        id: generation.id,
        originalUrl,
        resultUrl,
        styleChosen: generation.styleChosen,
        createdAt: generation.createdAt.toISOString(),
      };
    }),
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--bg-cream)] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--brand-crimson)]">
                  Melina Salon
                </p>

                <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                  پنل کاربری
                </h1>

                <p className="mt-3 text-[var(--text-secondary)]">
                  اطلاعات حساب، نوبت‌ها و تصاویر تولیدشده با آرایشگر هوش مصنوعی
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mb-8">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                اطلاعات حساب
              </h2>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                اطلاعات حساب کاربری شما
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                <p className="text-xs text-[var(--text-secondary)]">
                  شماره موبایل
                </p>

                <p className="mt-2 font-semibold text-[var(--text-primary)]">
                  {user.phoneNumber}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                <p className="text-xs text-[var(--text-secondary)]">
                  تاریخ عضویت
                </p>

                <p className="mt-2 font-semibold text-[var(--text-primary)]">
                  {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
            <MyBookings />
          </div>
        </section>

        <section>
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
            <MyGenerations generations={generationsWithUrls} />
          </div>
        </section>
      </div>
    </main>
  );
}
