import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  return (
    <header className="relative w-full">
      {/* Top information bar */}
      <div className="bg-[var(--brand-crimson-dark)] text-white">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6 text-xs">
          {/* Right side */}
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="text-[var(--accent-gold)]">◷</span>
              ساعات کاری: همه روزه ۹:۰۰ تا ۲۰:۰۰
            </span>

            <span className="hidden md:inline-flex items-center gap-2">
              <span className="text-[var(--accent-gold)]">⌖</span>
              شاهرود
            </span>
          </div>

          {/* Left side */}
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="text-[var(--accent-gold)]">☎</span>
              شماره تماس: ۰۲۱-۱۲۳۴۵۶۷۸
            </span>

            <span className="rounded-full border border-[var(--accent-gold)]/40 bg-white/10 px-3 py-1">
              وضعیت فعلی: وارد شده
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-cream)]">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-6">
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-0">
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
          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              صفحه اصلی
            </Link>

            <Link
              href="/services"
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
              href="/about"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              درباره ما
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3">
            {/* User */}
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-xl border border-[var(--border-beige)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)] md:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-xs text-[var(--brand-crimson)]">
                م
              </span>
              حساب کاربری
            </Link>

            {/* Booking CTA */}
            <Link
              href="/booking"
              className="rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
            >
              رزرو نوبت
            </Link>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
