import Link from "next/link";
import {
  Award,
  Cake,
  CalendarCheck,
  Phone,
  PhoneCall,
  Sparkles,
  Wand2,
} from "lucide-react";

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

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "ثبت نشده";
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

function formatMemberSinceYear(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
  }).format(new Date(dateString));
}

function formatBookingDateTime(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function DashboardShell({
  user,
  bookings,
  generations,
  stats,
}: DashboardShellProps) {
  const firstName = getFirstName(user.fullName);
  const isLoyalCustomer =
    stats.completedVisitsCount >= LOYAL_CUSTOMER_THRESHOLD;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
                  عضو سالن ملینا از سال {formatMemberSinceYear(user.createdAt)}
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
                استایل‌های هوش مصنوعی
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Sparkles size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.generationCount}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                مجموع حضور در سالن
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Award size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
              {stats.completedVisitsCount}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--brand-crimson)] p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/80">
                سهمیه هوش مصنوعی امروز
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Wand2 size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {stats.remainingAiGenerations} از ۳
            </p>
          </div>
        </div>
      </section>

      {/* Main two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-7">
            <MyBookings bookings={bookings} />
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-7">
            <MyGenerations generations={generations} />
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          {/* Next booking CTA card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-crimson)] to-[var(--brand-crimson-dark)] p-6 text-white shadow-[0_8px_30px_rgba(108,0,32,0.15)]">
            <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex items-center gap-2">
              <CalendarCheck size={20} />
              <span className="font-bold">نوبت بعدی شما</span>
            </div>

            {stats.nextBooking ? (
              <div className="relative mt-4">
                <p className="text-lg font-bold">
                  {stats.nextBooking.serviceName}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {formatBookingDateTime(stats.nextBooking.startsAt)}
                </p>
              </div>
            ) : (
              <p className="relative mt-4 text-sm leading-6 text-white/85">
                در حال حاضر نوبت فعالی ندارید. برای رزرو نوبت جدید کلیک کنید.
              </p>
            )}

            <Link
              href="/#booking"
              className="relative mt-5 inline-flex w-full items-center justify-center rounded-full bg-white/15 px-5 py-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              {stats.nextBooking ? "مشاهده و مدیریت نوبت‌ها" : "رزرو نوبت"}
            </Link>
          </div>

          {/* Account details */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)]">
              اطلاعات حساب کاربری
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2.5">
                <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Phone size={15} />
                  شماره همراه
                </span>
                <span
                  className="text-sm font-medium text-[var(--text-primary)]"
                  dir="ltr"
                >
                  {user.phoneNumber}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2.5">
                <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Cake size={15} />
                  تاریخ تولد
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {formatDate(user.birthDate)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-[var(--text-secondary)]">
                  تاریخ عضویت
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Consultation banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <PhoneCall size={19} />
            </span>

            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                مشاوره تلفنی با تیم ملینا
              </h4>
              <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                سوالی درباره خدمات یا رزرو نوبت دارید؟ با ما تماس بگیرید.
              </p>
              <a
                href="tel:+989000000000"
                className="mt-2 inline-block text-sm font-bold text-[var(--brand-crimson)] hover:underline"
                dir="ltr"
              >
                تماس مستقیم
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
