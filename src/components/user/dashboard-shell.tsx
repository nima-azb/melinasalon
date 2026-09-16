"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { MyBookings } from "@/components/user/my-bookings";
import { MyGenerations } from "@/components/user/my-generations";

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Booking = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    duration: number;
  };
};

type Generation = {
  id: string;
  workflowType: "CUSTOM" | "RECOMMENDATION";
  originalUrl: string;
  resultUrl: string;
  styleChosen: string | null;
  createdAt: string;
};

type DashboardShellProps = {
  user: {
    fullName: string | null;
    phoneNumber: string;
    birthDate: string | null;
    createdAt: string;
  };
  bookings: Booking[];
  generations: Generation[];
  stats: {
    bookingCount: number;
    generationCount: number;
    remainingAiGenerations: number;
    hasEligibleAiBooking: boolean;
  };
};

type Section = "profile" | "bookings" | "generations";

const navigationItems: Array<{
  id: Section;
  label: string;
  description: string;
}> = [
  {
    id: "profile",
    label: "اطلاعات من",
    description: "پروفایل و اطلاعات حساب",
  },
  {
    id: "bookings",
    label: "نوبت‌های من",
    description: "نوبت‌ها و سوابق",
  },
  {
    id: "generations",
    label: "تصاویر هوش مصنوعی",
    description: "نتایج آرایشگر هوشمند",
  },
];

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "وارد نشده";
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

function getFirstName(fullName: string | null) {
  if (!fullName?.trim()) {
    return "دوست عزیز";
  }

  return fullName.trim().split(/\s+/)[0];
}

function Icon({
  name,
}: {
  name: "profile" | "calendar" | "sparkles" | "plus" | "menu" | "close";
}) {
  const common = "h-5 w-5 shrink-0 stroke-current stroke-[1.8] fill-none";

  switch (name) {
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20c.8-3.3 3-5 6.5-5s5.7 1.7 6.5 5" />
        </svg>
      );

    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" />
          <path d="M8 13h2M14 13h2M8 16.5h2" />
        </svg>
      );

    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M12 3l1.2 4.3L17.5 9l-4.3 1.7L12 15l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" />
          <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
          <path d="M5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5L5 14Z" />
        </svg>
      );

    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "menu":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );

    case "close":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
  }
}

function SectionIcon({ section }: { section: Section }) {
  if (section === "profile") {
    return <Icon name="profile" />;
  }

  if (section === "bookings") {
    return <Icon name="calendar" />;
  }

  return <Icon name="sparkles" />;
}

export function DashboardShell({
  user,
  bookings,
  generations,
  stats,
}: DashboardShellProps) {
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigateTo(section: Section) {
    setActiveSection(section);
    setMobileMenuOpen(false);

    window.setTimeout(() => {
      document
        .getElementById(`dashboard-${section}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const firstName = getFirstName(user.fullName);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--bg-cream)] text-[var(--text-primary)]"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-6 lg:flex lg:flex-col">
          <div className="border-b border-[var(--border-subtle)] px-3 pb-6">
            <p className="text-sm font-medium text-[var(--brand-crimson)]">
              Melina Salon
            </p>

            <h1 className="mt-2 text-2xl font-bold">پنل کاربری</h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              همه اطلاعات شخصی، نوبت‌ها و تصاویر هوش مصنوعی شما در یکجا.
            </p>
          </div>

          <nav className="mt-6 space-y-2" aria-label="ناوبری پنل کاربری">
            {navigationItems.map((item) => {
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right transition ${
                    active
                      ? "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson-dark)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      active
                        ? "bg-white text-[var(--brand-crimson)]"
                        : "bg-[var(--bg-card-warm)]"
                    }`}
                  >
                    <SectionIcon section={item.id} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs opacity-75">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <Link
              href="/#booking"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
            >
              <Icon name="plus" />
              رزرو نوبت جدید
            </Link>

            <Link
              href="/ai-hairdresser"
              className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-beige)] bg-[var(--bg-card-warm)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)]"
            >
              <Icon name="sparkles" />
              آرایشگر هوش مصنوعی
            </Link>

            <div className="border-t border-[var(--border-subtle)] pt-4">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="بستن منو"
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside className="relative h-full w-[min(88vw,340px)] bg-[var(--bg-card)] p-5 shadow-2xl">
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-5">
                <div>
                  <p className="text-sm font-medium text-[var(--brand-crimson)]">
                    Melina Salon
                  </p>
                  <h2 className="mt-1 text-xl font-bold">پنل کاربری</h2>
                </div>

                <button
                  type="button"
                  aria-label="بستن منو"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)]"
                >
                  <Icon name="close" />
                </button>
              </div>

              <nav className="mt-5 space-y-2">
                {navigationItems.map((item) => {
                  const active = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right ${
                        active
                          ? "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson-dark)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <SectionIcon section={item.id} />

                      <span className="text-sm font-semibold">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 space-y-3">
                <Link
                  href="/#booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-4 py-3.5 text-sm font-semibold text-white"
                >
                  <Icon name="plus" />
                  رزرو نوبت جدید
                </Link>

                <Link
                  href="/ai-hairdresser"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--bg-card-warm)] px-4 py-3.5 text-sm font-semibold"
                >
                  <Icon name="sparkles" />
                  آرایشگر هوش مصنوعی
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">
            {/* Mobile header */}
            <header className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 lg:hidden">
              <div>
                <p className="text-xs font-medium text-[var(--brand-crimson)]">
                  Melina Salon
                </p>
                <p className="mt-1 font-bold">پنل کاربری</p>
              </div>

              <button
                type="button"
                aria-label="باز کردن منو"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl bg-[var(--bg-card-warm)] p-2.5 text-[var(--text-primary)]"
              >
                <Icon name="menu" />
              </button>
            </header>

            {/* Greeting */}
            <section className="mb-6 overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm">
              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[var(--brand-crimson-light)] opacity-70 blur-2xl" />

                <div className="relative">
                  <p className="text-sm font-medium text-[var(--brand-crimson)]">
                    خوش آمدید
                  </p>

                  <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold sm:text-3xl">
                        {firstName} عزیز
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                        از اینجا می‌توانید اطلاعات حساب، نوبت‌های خود و
                        تجربه‌های آرایشگر هوش مصنوعی را مدیریت کنید.
                      </p>
                    </div>

                    <Link
                      href="/#booking"
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
                    >
                      <Icon name="plus" />
                      رزرو نوبت
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="mb-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => navigateTo("bookings")}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-right transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                    <Icon name="calendar" />
                  </span>

                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat("fa-IR").format(stats.bookingCount)}
                  </span>
                </div>

                <p className="mt-4 text-sm font-semibold">نوبت‌های من</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  مشاهده نوبت‌ها و سوابق
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigateTo("generations")}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-right transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                    <Icon name="sparkles" />
                  </span>

                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat("fa-IR").format(
                      stats.generationCount,
                    )}
                  </span>
                </div>

                <p className="mt-4 text-sm font-semibold">تصاویر هوش مصنوعی</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  مشاهده نتایج قبلی
                </p>
              </button>

              <Link
                href="/ai-hairdresser"
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-right transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                    <Icon name="sparkles" />
                  </span>

                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat("fa-IR").format(
                      stats.remainingAiGenerations,
                    )}
                  </span>
                </div>

                <p className="mt-4 text-sm font-semibold">
                  اعتبار باقی‌مانده هوش مصنوعی
                </p>

                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {stats.hasEligibleAiBooking
                    ? "در ۲۴ ساعت گذشته"
                    : "برای استفاده نیاز به نوبت تأییدشده دارید"}
                </p>
              </Link>
            </section>

            {/* Profile */}
            <section id="dashboard-profile" className="scroll-mt-6">
              <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
                <div className="mb-7">
                  <p className="text-sm font-medium text-[var(--brand-crimson)]">
                    پروفایل
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">اطلاعات من</h2>

                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    اطلاعاتی که هنگام ثبت‌نام در اختیار سالن قرار داده‌اید.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                    <p className="text-xs text-[var(--text-secondary)]">
                      نام و نام خانوادگی
                    </p>

                    <p className="mt-2 font-semibold">
                      {user.fullName || "وارد نشده"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                    <p className="text-xs text-[var(--text-secondary)]">
                      شماره موبایل
                    </p>

                    <p className="mt-2 font-semibold" dir="ltr">
                      {user.phoneNumber}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                    <p className="text-xs text-[var(--text-secondary)]">
                      تاریخ تولد
                    </p>

                    <p className="mt-2 font-semibold">
                      {formatDate(user.birthDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5 sm:col-span-2 lg:col-span-1">
                    <p className="text-xs text-[var(--text-secondary)]">
                      تاریخ عضویت
                    </p>

                    <p className="mt-2 font-semibold">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bookings */}
            <section id="dashboard-bookings" className="mt-6 scroll-mt-6">
              <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
                <MyBookings bookings={bookings} />
              </div>
            </section>

            {/* Generations */}
            <section id="dashboard-generations" className="mt-6 scroll-mt-6">
              <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
                <MyGenerations generations={generations} />
              </div>
            </section>

            <footer className="py-8 text-center text-xs text-[var(--text-secondary)]">
              Melina Salon · پنل کاربری
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
