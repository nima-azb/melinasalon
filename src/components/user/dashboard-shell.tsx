import Link from "next/link";
import { Award, CalendarCheck, Gift, Phone, Wand2 } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { MyBookings } from "@/components/user/my-bookings";
import { MyGenerations } from "@/components/user/my-generations";

const LOYAL_CUSTOMER_THRESHOLD = 3;

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

type ActiveDiscount = {
  code: string;
  discountPercent: number;
  expiresAt: string;
};

type DashboardShellProps = {
  user: {
    fullName: string | null;
    phoneNumber: string;
    birthDate: string | null;
    createdAt: string;
  };
  activeBirthdayDiscount?: ActiveDiscount | null;
  bookings: Booking[];
  generations: Generation[];
  stats: {
    activeBookingsCount: number;
    completedVisitsCount: number;
    generationCount: number;
    remainingAiGenerations: number;
    hasEligibleAiBooking: boolean;
    nextBooking: { serviceName: string; startsAt: string } | null;
  };
};

function getFirstName(fullName: string | null) {
  if (!fullName?.trim()) {
    return null;
  }

  return fullName.trim().split(/\s+/)[0];
}

function getInitial(fullName: string | null) {
  const firstName = getFirstName(fullName);
  return firstName ? firstName.charAt(0) : "م";
}

function formatMemberSinceYear(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
  }).format(new Date(dateString));
}

function formatExpiryDate(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

export function DashboardShell({
  user,
  activeBirthdayDiscount,
  bookings,
  generations,
  stats,
}: DashboardShellProps) {
  const firstName = getFirstName(user.fullName);
  const isLoyalCustomer =
    stats.completedVisitsCount >= LOYAL_CUSTOMER_THRESHOLD;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Birthday discount banner */}
      {activeBirthdayDiscount && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--accent-gold)]/40 bg-gradient-to-r from-[var(--brand-crimson)] via-[var(--brand-crimson-hover)] to-[var(--brand-crimson-dark)] p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-sm">
                <Gift size={26} className="text-[var(--accent-gold)]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold sm:text-lg">
                    تولدتان مبارک! هدیه اختصاصی سالن ملینا بیوتی
                  </h2>
                </div>

                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  کد تخفیف {activeBirthdayDiscount.discountPercent}٪ اختصاصی شما
                  تا تاریخ {formatExpiryDate(activeBirthdayDiscount.expiresAt)}{" "}
                  معتبر است.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-mono text-sm font-bold tracking-wider text-white backdrop-blur-sm sm:self-auto sm:text-base">
              <span>{activeBirthdayDiscount.code}</span>
            </div>
          </div>
        </div>
      )}

      {/* Welcome card */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-xl font-bold text-[var(--brand-crimson)] sm:h-20 sm:w-20 sm:text-2xl">
              {getInitial(user.fullName)}
              {isLoyalCustomer && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-white shadow-sm">
                  <Award size={13} />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                  {firstName
                    ? `سلام ${firstName} عزیز، خوش آمدید`
                    : "خوش آمدید"}
                </h1>

                {isLoyalCustomer && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-crimson-light)] px-3 py-1 text-xs font-semibold text-[var(--brand-crimson)]">
                    <Award size={13} />
                    مشتری وفادار
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] sm:text-sm">
                <span className="flex items-center gap-1.5" dir="ltr">
                  <Phone size={14} />
                  {user.phoneNumber}
                </span>

                <span className="text-[var(--border-beige)]">•</span>

                <span>
                  عضو سالن ملین بیوتی از سال{" "}
                  {formatMemberSinceYear(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-crimson)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
            >
              <CalendarCheck size={17} />
              رزرو نوبت جدید
            </Link>

            <Link
              href="/ai-hairdresser"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card-warm)] px-5 py-3 text-sm font-semibold text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson-light)]"
            >
              <Wand2 size={17} />
              آرایشگر هوش مصنوعی
            </Link>

            <LogoutButton className="!bg-transparent !px-3 !text-xs !font-medium !text-[var(--text-secondary)] hover:!text-red-600" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-6 lg:grid-cols-4">
          <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                نوبت‌های فعال
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <CalendarCheck size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.activeBookingsCount}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                بازدیدهای تکمیل‌شده
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Award size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.completedVisitsCount}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                استایل‌های هوش مصنوعی
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Wand2 size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.generationCount}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                فرصت‌های باقیمانده هوش مصنوعی
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Wand2 size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.remainingAiGenerations}
            </p>
          </div>
        </div>
      </section>

      {/* Bookings & Generations section */}
      <div className="mt-10 space-y-10">
        <MyBookings bookings={bookings} />
        <MyGenerations generations={generations} />
      </div>
    </div>
  );
}
