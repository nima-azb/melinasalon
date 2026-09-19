import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import { MobileNav } from "./mobile-nav";

export async function Navbar() {
  const user = await getCurrentUser();

  const fullName = user?.fullName?.trim() || "کاربر";
  const userInitial = fullName.charAt(0);

  return (
    <header className="relative w-full">
      {/* Top information bar */}
      <div className="bg-[var(--brand-crimson-dark)] text-white">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6 text-xs">
          {/* Right side */}
          <div className="flex items-center gap-6">
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="text-[var(--accent-gold)]">◷</span>
              ساعات کاری: همه روزه ۱۰:۰۰ تا ۲۲:۰۰
            </span>

            <span className="hidden items-center gap-2 md:inline-flex">
              <span className="text-[var(--accent-gold)]">⌖</span>
              شاهرود
            </span>
          </div>

          {/* Left side */}
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="text-[var(--accent-gold)]">☎</span>
              شماره تماس: ۰۲۱-۱۲۳۴۵۶۷۸
            </span>

            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--accent-gold)]/40 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
              >
                خوش آمدید، {fullName.split(/\s+/)[0]}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-[var(--accent-gold)]/40 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
              >
                ورود / ثبت‌نام
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-cream)]">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-6">
          {/* Brand */}
          <Link
            href="/"
            aria-label="صفحه اصلی سالن زیبایی ملینا"
            className="flex shrink-0 items-center gap-0"
          >
            <div className="relative h-23 w-23 overflow-hidden rounded-xl">
              <Image
                src="/images/logo1.png"
                alt="لوگوی سالن زیبایی ملینا"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-xl font-bold text-[var(--brand-crimson-dark)]">
                سالن زیبایی ملینا
              </div>

              <div className="mt-0.5 text-xs tracking-[0.18em] text-[var(--brand-crimson)]">
                MELINA BEAUTY SALON
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="منوی اصلی"
          >
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              صفحه اصلی
            </Link>

            <Link
              href="/#services"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              خدمات
            </Link>

            <Link
              href="/ai-hairdresser"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              <span className="rounded-full bg-[var(--brand-crimson)] px-2 py-0.5 text-[10px] text-white">
                جدید
              </span>
              آرایشگر هوش مصنوعی
            </Link>

            <Link
              href="/#why-melina"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              درباره ما
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3">
            {/* User */}
            <Link
              href={user ? "/dashboard" : "/login"}
              aria-label={
                user ? `حساب کاربری ${fullName}` : "ورود به حساب کاربری"
              }
              className="group hidden h-12 max-w-52 items-center gap-2 rounded-xl border border-[var(--border-beige)] bg-white px-4 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)] hover:shadow-md md:flex"
            >
              {/* Avatar */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                  user
                    ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                    : "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)] group-hover:bg-[var(--brand-crimson)] group-hover:text-white"
                }`}
              >
                {user ? userInitial : <UserRound size={16} strokeWidth={1.8} />}
              </span>

              {/* Full name */}
              <span
                className="truncate whitespace-nowrap"
                title={user ? fullName : "ورود"}
              >
                {user ? fullName : "ورود"}
              </span>
            </Link>

            {/* Booking CTA */}
            <Link
              href="/#booking"
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--brand-crimson)] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-crimson-hover)] hover:shadow-md"
            >
              رزرو نوبت
            </Link>

            <MobileNav isLoggedIn={Boolean(user)} />
          </div>
        </div>
      </div>
    </header>
  );
}
