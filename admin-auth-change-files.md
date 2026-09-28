# Admin Authentication & Profile Routing — Required Source Files


Generated: 2026-09-28 11:16:43


## `src\app\(public)\page.tsx`

```tsx
import { Hero } from "@/components/public/home/hero";
import { Services } from "@/components/public/home/services";
import { AIHairdresser } from "@/components/public/home/ai-hairdresser";
import { WhyMelina } from "@/components/public/home/why-melina";
import { Booking } from "@/components/public/home/booking";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <AIHairdresser />
      <WhyMelina />
      <Booking />
    </>
  );
}

```

---

## `src\components\public\navbar.tsx`

```tsx
import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import { MobileNav } from "./mobile-nav";

export async function Navbar() {
  const user = await getCurrentUser();

  const fullName = user?.fullName?.trim() || "Ú©Ø§Ø±Ø¨Ø±";
  const userInitial = fullName.charAt(0);

  return (
    <header className="relative w-full">
      {/* Top information bar */}
      <div className="bg-[var(--brand-crimson-dark)] text-white">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6 text-xs">
          {/* Right side */}
          <div className="flex items-center gap-6">
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="text-[var(--accent-gold)]">â—·</span>
              Ø³Ø§Ø¹Ø§Øª Ú©Ø§Ø±ÛŒ: Ù‡Ù…Ù‡ Ø±ÙˆØ²Ù‡ Û¸:Û°Û° ØªØ§ Û²Û±:Û°Û°
            </span>

            <span className="hidden items-center gap-2 md:inline-flex">
              <span className="text-[var(--accent-gold)]">âŒ–</span>
              Ø´Ø§Ù‡Ø±ÙˆØ¯
            </span>
          </div>

          {/* Left side */}
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="text-[var(--accent-gold)]">â˜Ž</span>
              Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³:
              <a href="tel:+982332335960" className="text-sm" dir="ltr">
                Û°Û¹Û³Ûµ Û´Û·Û² Û¸Û´Û´Û¸
              </a>
            </span>

            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--accent-gold)]/40 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
              >
                Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯ØŒ {fullName.split(/\s+/)[0]}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-[var(--accent-gold)]/40 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
              >
                ÙˆØ±ÙˆØ¯ / Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…
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
            aria-label="ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ Ø³Ø§Ù„Ù† Ø²ÛŒØ¨Ø§ÛŒÛŒ Ù…Ù„ÛŒÙ† Ø¨ÛŒÙˆØªÛŒ"
            className="flex shrink-0 items-center gap-0"
          >
            <div className="relative h-23 w-23 overflow-hidden rounded-xl">
              <Image
                src="/images/logo1.png"
                alt="Ù„ÙˆÚ¯ÙˆÛŒ Ø³Ø§Ù„Ù† Ø²ÛŒØ¨Ø§ÛŒÛŒ Ù…Ù„ÛŒÙ† Ø¨ÛŒÙˆØªÛŒ"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-xl font-bold text-[var(--brand-crimson-dark)]">
                Ø³Ø§Ù„Ù† Ø²ÛŒØ¨Ø§ÛŒÛŒ Ù…Ù„ÛŒÙ† Ø¨ÛŒÙˆØªÛŒ
              </div>

              <div className="mt-0.5 text-xs tracking-[0.18em] text-[var(--brand-crimson)]">
                MELINA BEAUTY SALON
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Ù…Ù†ÙˆÛŒ Ø§ØµÙ„ÛŒ"
          >
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ
            </Link>

            <Link
              href="/#services"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              Ø®Ø¯Ù…Ø§Øª
            </Link>

            <Link
              href="/ai-hairdresser"
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              <span className="rounded-full bg-[var(--brand-crimson)] px-2 py-0.5 text-[10px] text-white">
                Ø¬Ø¯ÛŒØ¯
              </span>
              Ø¢Ø±Ø§ÛŒØ´Ú¯Ø± Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            </Link>

            <Link
              href="/#why-melina"
              className="text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-crimson)]"
            >
              Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ø§
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3">
            {/* User */}
            <Link
              href={user ? "/dashboard" : "/login"}
              aria-label={
                user ? `Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ ${fullName}` : "ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ"
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
                title={user ? fullName : "ÙˆØ±ÙˆØ¯"}
              >
                {user ? fullName : "ÙˆØ±ÙˆØ¯"}
              </span>
            </Link>

            {/* Booking CTA */}
            <Link
              href="/#booking"
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--brand-crimson)] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-crimson-hover)] hover:shadow-md"
            >
              Ø±Ø²Ø±Ùˆ Ù†ÙˆØ¨Øª
            </Link>

            <MobileNav isLoggedIn={Boolean(user)} />
          </div>
        </div>
      </div>
    </header>
  );
}

```

---

## `src\components\public\mobile-nav.tsx`

```tsx
"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navigationItems = [
  { href: "/", label: "ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ" },
  { href: "/#services", label: "Ø®Ø¯Ù…Ø§Øª" },
  { href: "/ai-hairdresser", label: "Ø¢Ø±Ø§ÛŒØ´Ú¯Ø± Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ", isNew: true },
  { href: "/#why-melina", label: "Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ø§" },
];

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Ø¨Ø³ØªÙ† Ù…Ù†Ùˆ" : "Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ù…Ù†Ùˆ"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-beige)] bg-white text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson-light)]"
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg">
          <nav className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex flex-col">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-[var(--border-subtle)] py-4 text-sm font-medium text-[var(--text-primary)] transition-colors last:border-b-0 hover:text-[var(--brand-crimson)]"
                >
                  <span>{item.label}</span>

                  {item.isNew && (
                    <span className="rounded-full bg-[var(--brand-crimson)] px-2 py-0.5 text-[10px] text-white">
                      Ø¬Ø¯ÛŒØ¯
                    </span>
                  )}
                </Link>
              ))}

              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                onClick={() => setOpen(false)}
                className="mt-4 rounded-xl border border-[var(--border-beige)] bg-[var(--bg-card-warm)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
              >
                {isLoggedIn ? "Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ" : "ÙˆØ±ÙˆØ¯ / Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

```

---

## `src\app\(admin)\admin\layout.tsx`

```tsx
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return children;
}

```

---

## `src\app\(admin)\admin\page.tsx`

```tsx
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminPage() {
  // Auth/role guard already runs in this route's layout.tsx â€” thanks to
  // getCurrentUser() being wrapped in React's cache(), calling it again
  // here to read the admin's name doesn't cost a second DB query.
  const user = await getCurrentUser();

  return <AdminDashboard adminName={user?.fullName ?? null} />;
}

```

---

## `src\app\(auth)\login\page.tsx`

```tsx
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-main)] px-4 py-8 sm:px-6"
    >
      {/* Decorative background elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[var(--brand-crimson)]/5 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[var(--brand-crimson)]/5 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-crimson)]/[0.03]"
      />

      <LoginForm />
    </main>
  );
}

```

---

## `src\components\auth\login-form.tsx`

```tsx
"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  LogIn,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ø®Ø·Ø§ Ø¯Ø± Ø§Ø±Ø³Ø§Ù„ Ú©Ø¯");
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø®Ø·Ø§ÛŒÛŒ Ø±Ø® Ø¯Ø§Ø¯");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ú©Ø¯ Ø§Ø´ØªØ¨Ø§Ù‡ Ø§Ø³Øª");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø®Ø·Ø§ÛŒÛŒ Ø±Ø® Ø¯Ø§Ø¯");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (step === "phone") {
      void sendOtp();
    } else {
      void verifyOtp();
    }
  }

  function changePhone() {
    setStep("phone");
    setCode("");
    setError("");
  }

  return (
    <div className="relative z-10 w-full max-w-[440px]">
      {/* Brand */}
      <div className="mb-7 text-center">
        <Link
          href="/"
          className="group inline-flex flex-col items-center"
          aria-label="Ø¨Ø§Ø²Ú¯Ø´Øª Ø¨Ù‡ ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-crimson)] text-white shadow-[0_12px_30px_rgba(110,0,32,0.18)] transition-transform duration-300 group-hover:-translate-y-1">
            <Sparkles size={24} strokeWidth={1.8} />
          </div>

          <span className="text-2xl font-bold tracking-tight text-[var(--brand-crimson)]">
            Ù…Ù„ÛŒÙ† Ø¨ÛŒÙˆØªÛŒ
          </span>

          <span className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
            Ø³Ø§Ù„Ù† Ø²ÛŒØ¨Ø§ÛŒÛŒ
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_25px_80px_rgba(36,20,23,0.10)]">
        {/* Top accent */}
        <div className="h-1 w-full bg-[var(--brand-crimson)]" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-crimson)]/8 text-[var(--brand-crimson)]">
              {step === "phone" ? (
                <Phone size={21} strokeWidth={1.8} />
              ) : (
                <ShieldCheck size={22} strokeWidth={1.8} />
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[26px]">
              {step === "phone" ? "Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯" : "ØªØ§ÛŒÛŒØ¯ Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„"}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {step === "phone"
                ? "Ø¨Ø±Ø§ÛŒ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒØŒ Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ø®ÙˆØ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯."
                : `Ú©Ø¯ ØªØ§ÛŒÛŒØ¯ Ø§Ø±Ø³Ø§Ù„â€ŒØ´Ø¯Ù‡ Ø¨Ù‡ ${phone} Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.`}
            </p>
          </div>

          {/* Progress */}
          <div className="mt-7 flex items-center justify-center gap-2">
            <div
              className={`h-1.5 w-14 rounded-full transition-colors ${
                step === "phone"
                  ? "bg-[var(--brand-crimson)]"
                  : "bg-[var(--brand-crimson)]"
              }`}
            />

            <div
              className={`h-1.5 w-14 rounded-full transition-colors ${
                step === "otp"
                  ? "bg-[var(--brand-crimson)]"
                  : "bg-[var(--border-subtle)]"
              }`}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {step === "phone" ? (
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2.5 block text-sm font-semibold text-[var(--text-primary)]"
                >
                  Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„
                </label>

                <div className="group relative">
                  <Phone
                    size={18}
                    strokeWidth={1.8}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--brand-crimson)]"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="09121234567"
                    required
                    disabled={loading}
                    className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3.5 pl-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--brand-crimson)]/6 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--text-secondary)]">
                  <ShieldCheck
                    size={15}
                    className="mt-0.5 shrink-0 text-[var(--brand-crimson)]"
                  />

                  <span>
                    ÙˆØ±ÙˆØ¯ Ø¨Ø§ Ú©Ø¯ ÛŒÚ©Ø¨Ø§Ø±Ù…ØµØ±Ù Ø§Ù†Ø¬Ø§Ù… Ù…ÛŒâ€ŒØ´ÙˆØ¯ Ùˆ Ù†ÛŒØ§Ø²ÛŒ Ø¨Ù‡ Ø­ÙØ¸ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±
                    Ù†Ø¯Ø§Ø±ÛŒØ¯.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="code"
                  className="mb-2.5 block text-sm font-semibold text-[var(--text-primary)]"
                >
                  Ú©Ø¯ ØªØ§ÛŒÛŒØ¯
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-4 text-center text-xl font-semibold tracking-[0.55em] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--brand-crimson)]/6 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Clock3 size={14} />
                  <span>Ú©Ø¯ Ø§Ø±Ø³Ø§Ù„â€ŒØ´Ø¯Ù‡ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                <span className="mt-0.5 shrink-0">â—</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(110,0,32,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-crimson-hover)] hover:shadow-[0_14px_30px_rgba(110,0,32,0.22)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Ù„Ø·ÙØ§Ù‹ ØµØ¨Ø± Ú©Ù†ÛŒØ¯...</span>
                </>
              ) : (
                <>
                  {step === "otp" ? (
                    <LogIn
                      size={17}
                      strokeWidth={2}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                  ) : (
                    <ArrowRight
                      size={17}
                      strokeWidth={2}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                  )}

                  <span>
                    {step === "phone" ? "Ø¯Ø±ÛŒØ§ÙØª Ú©Ø¯ ØªØ§ÛŒÛŒØ¯" : "ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨"}
                  </span>
                </>
              )}
            </button>

            {/* Change phone */}
            {step === "otp" && (
              <button
                type="button"
                onClick={changePhone}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-[var(--brand-crimson)] transition-colors hover:text-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                <span>ØªØºÛŒÛŒØ± Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„</span>
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-secondary)]">ÛŒØ§</span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          {/* Register */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-4 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ù†Ø¯Ø§Ø±ÛŒØ¯ØŸ
              <Link
                href="/register"
                className="mr-1.5 font-bold text-[var(--brand-crimson)] transition-colors hover:text-[var(--brand-crimson-hover)] hover:underline"
              >
                Ø«Ø¨Øª Ù†Ø§Ù… Ú©Ù†ÛŒØ¯
              </Link>
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-6 py-4 sm:px-8">
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 size={15} className="text-[var(--brand-crimson)]" />

            <span>ÙˆØ±ÙˆØ¯ Ø§Ù…Ù† Ùˆ Ù…Ø­Ø§ÙØ¸Øªâ€ŒØ´Ø¯Ù‡ Ø¨Ø§ Ú©Ø¯ ÛŒÚ©Ø¨Ø§Ø±Ù…ØµØ±Ù</span>
          </div>
        </div>
      </div>

      {/* Back home */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
        >
          <ChevronLeft size={14} />
          <span>Ø¨Ø§Ø²Ú¯Ø´Øª Ø¨Ù‡ ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ</span>
        </Link>
      </div>
    </div>
  );
}

```

---

## `src\components\auth\logout-button.tsx`

```tsx
"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className={`rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-bold text-white ${className}`}
    >
      Ø®Ø±ÙˆØ¬ Ø§Ø² Ø­Ø³Ø§Ø¨
    </button>
  );
}

```

---

## `src\lib\auth\constants.ts`

```ts
export const OTP_LENGTH = 6;

export const OTP_EXPIRY_SECONDS = 120;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const OTP_MAX_ATTEMPTS = 5;

export const SESSION_COOKIE_NAME = "melina_session";

export const SESSION_EXPIRES_DAYS = 30;

```

---

## `src\lib\auth\get-current-user.ts`

```ts
import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { verifySession, SESSION_COOKIE_NAME } from "./session";

/**
 * Wrapped in React's cache() so multiple calls within the same request
 * (e.g. a page component and <Navbar /> both calling this) share one
 * result instead of each re-verifying the session cookie and re-querying
 * the database. This was previously happening on every admin, dashboard,
 * and ai-hairdresser page load.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  return user;
});

```

---

## `src\lib\auth\otp.ts`

```ts
import { createHash, randomInt } from "crypto";

import { OTP_EXPIRY_SECONDS, OTP_LENGTH } from "./constants";

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return randomInt(min, max).toString();
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
}

export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

```

---

## `src\lib\auth\phone.ts`

```ts
import { z } from "zod";

const iranianPhoneSchema = z.string().trim().min(10).max(15);

function convertToEnglishDigits(value: string): string {
  return value
    .replace(/[Û°-Û¹]/g, (digit) => String("Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹".indexOf(digit)))
    .replace(/[Ù -Ù©]/g, (digit) => String("Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(digit)));
}

export function normalizeIranianPhone(phone: string): string {
  const value = phone.trim().replace(/[\s-]/g, "");

  if (!iranianPhoneSchema.safeParse(value).success) {
    throw new Error("Invalid phone number");
  }

  const normalizedDigits = convertToEnglishDigits(value);

  if (/^09\d{9}$/.test(normalizedDigits)) {
    return `+98${normalizedDigits.slice(1)}`;
  }

  if (/^989\d{9}$/.test(normalizedDigits)) {
    return `+${normalizedDigits}`;
  }

  if (/^\+989\d{9}$/.test(normalizedDigits)) {
    return normalizedDigits;
  }

  throw new Error("Invalid Iranian phone number");
}

export function isValidIranianPhone(phone: string): boolean {
  try {
    normalizeIranianPhone(phone);
    return true;
  } catch {
    return false;
  }
}

```

---

## `src\lib\auth\require-admin.ts`

```ts
import { NextResponse } from "next/server";

import { getCurrentUser } from "./get-current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Ø¨Ø±Ø§ÛŒ Ø§Ø¯Ø§Ù…Ù‡ Ø¨Ø§ÛŒØ¯ ÙˆØ§Ø±Ø¯ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø®ÙˆØ¯ Ø´ÙˆÛŒØ¯.",
      },
      { status: 401 },
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "Ø§ÛŒÙ† Ø¨Ø®Ø´ ÙÙ‚Ø· Ø¨Ø±Ø§ÛŒ Ù…Ø¯ÛŒØ±Ø§Ù† Ø³Ø§Ù„Ù† Ù‚Ø§Ø¨Ù„ Ø¯Ø³ØªØ±Ø³ÛŒ Ø§Ø³Øª.",
      },
      { status: 403 },
    );
  }

  return user;
}

```

---

## `src\lib\auth\require-user.ts`

```ts
import { redirect } from "next/navigation";

import { getCurrentUser } from "./get-current-user";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

```

---

## `src\lib\auth\session.ts`

```ts
import { SignJWT, jwtVerify } from "jose";

import { SESSION_EXPIRES_DAYS } from "./constants";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not configured");
}

const secretKey = new TextEncoder().encode(sessionSecret);

export const SESSION_COOKIE_NAME = "melina_session";

export type SessionPayload = {
  userId: string;
  role: "USER" | "ADMIN";
};

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRES_DAYS}d`)
    .sign(secretKey);
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "USER" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

```

---

## `src\app\api\auth\logout\route.ts`

```ts
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø®Ø§Ø±Ø¬ Ø´Ø¯ÛŒØ¯.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ø®Ø±ÙˆØ¬ Ø§Ø² Ø­Ø³Ø§Ø¨ Ø¨Ø§ Ø®Ø·Ø§ Ù…ÙˆØ§Ø¬Ù‡ Ø´Ø¯.",
      },
      { status: 500 },
    );
  }
}

```

---

## `src\app\api\auth\send-otp\route.ts`

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OTP_EXPIRY_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/constants";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/auth/otp";
import { normalizeIranianPhone } from "@/lib/auth/phone";
import { smsProvider } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.phone !== "string") {
      return NextResponse.json(
        { success: false, message: "Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª." },
        { status: 400 },
      );
    }

    const purpose = body.purpose === "register" ? "REGISTER" : "LOGIN";
    let phoneNumber: string;

    try {
      phoneNumber = normalizeIranianPhone(body.phone);
    } catch {
      return NextResponse.json(
        { success: false, message: "Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª." },
        { status: 400 },
      );
    }

    let fullName: string | undefined;
    let birthDate: Date | undefined;

    if (purpose === "REGISTER") {
      if (typeof body.fullName !== "string") {
        return NextResponse.json(
          { success: false, message: "Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª." },
          { status: 400 },
        );
      }
      const trimmedFullName = body.fullName.trim();
      if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø¨Ø§ÛŒØ¯ Ø¨ÛŒÙ† Û² ØªØ§ Û±Û°Û° Ú©Ø§Ø±Ø§Ú©ØªØ± Ø¨Ø§Ø´Ø¯.",
          },
          { status: 400 },
        );
      }
      fullName = trimmedFullName;

      if (typeof body.birthDate !== "string") {
        return NextResponse.json(
          { success: false, message: "ØªØ§Ø±ÛŒØ® ØªÙˆÙ„Ø¯ Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª." },
          { status: 400 },
        );
      }
      const parsedBirthDate = new Date(`${body.birthDate}T00:00:00.000Z`);
      if (Number.isNaN(parsedBirthDate.getTime())) {
        return NextResponse.json(
          { success: false, message: "ØªØ§Ø±ÛŒØ® ØªÙˆÙ„Ø¯ ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª." },
          { status: 400 },
        );
      }
      if (parsedBirthDate > new Date()) {
        return NextResponse.json(
          { success: false, message: "ØªØ§Ø±ÛŒØ® ØªÙˆÙ„Ø¯ Ù†Ù…ÛŒâ€ŒØªÙˆØ§Ù†Ø¯ Ø¯Ø± Ø¢ÛŒÙ†Ø¯Ù‡ Ø¨Ø§Ø´Ø¯." },
          { status: 400 },
        );
      }
      birthDate = parsedBirthDate;

      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ø­Ø³Ø§Ø¨ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† Ø§Ø² Ù‚Ø¨Ù„ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯. Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø­Ø³Ø§Ø¨ Ø®ÙˆØ¯ Ø´ÙˆÛŒØ¯.",
          },
          { status: 409 },
        );
      }
    }

    const now = new Date();
    const latestRequest = await prisma.otpRequest.findFirst({
      where: { phoneNumber },
      orderBy: { requestedAt: "desc" },
    });

    if (latestRequest) {
      const elapsedSeconds =
        (now.getTime() - latestRequest.requestedAt.getTime()) / 1000;
      if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds,
        );
        return NextResponse.json(
          {
            success: false,
            message: `Ù„Ø·ÙØ§Ù‹ ${remainingSeconds} Ø«Ø§Ù†ÛŒÙ‡ ØµØ¨Ø± Ú©Ù†ÛŒØ¯ Ùˆ Ø³Ù¾Ø³ Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ú©Ø¯ Ú©Ù†ÛŒØ¯.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 },
        );
      }
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await prisma.otpCode.deleteMany({ where: { phoneNumber } });

    await prisma.$transaction([
      prisma.otpRequest.create({ data: { phoneNumber, requestedAt: now } }),
      prisma.otpCode.create({
        data: {
          phoneNumber,
          codeHash,
          expiresAt,
          purpose,
          fullName,
          birthDate,
        },
      }),
    ]);

    await smsProvider.sendOtp(phoneNumber, otp);

    return NextResponse.json({
      success: true,
      message: "Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§Ø±Ø³Ø§Ù„ Ø´Ø¯.",
      expiresIn: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Ø®Ø·Ø§ÛŒÛŒ Ù‡Ù†Ú¯Ø§Ù… Ø§Ø±Ø³Ø§Ù„ Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ø±Ø® Ø¯Ø§Ø¯." },
      { status: 500 },
    );
  }
}

```

---

## `src\app\api\auth\verify-otp\route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashOtp, isOtpExpired } from "@/lib/auth/otp";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { normalizeIranianPhone } from "@/lib/auth/phone";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = body?.phone;
    const code = body?.code;
    const requestedPurpose = body?.purpose;
    if (typeof rawPhone !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† Ùˆ Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ø§Ù„Ø²Ø§Ù…ÛŒ Ù‡Ø³ØªÙ†Ø¯." },
        { status: 400 },
      );
    }
    let phone: string;
    try {
      phone = normalizeIranianPhone(rawPhone);
    } catch {
      return NextResponse.json(
        { success: false, message: "Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª." },
        { status: 400 },
      );
    }
    const purpose = requestedPurpose === "register" ? "REGISTER" : "LOGIN";
    const otpRecord = await prisma.otpCode.findFirst({
      where: { phoneNumber: phone, purpose },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ ÛŒØ§ÙØª Ù†Ø´Ø¯." },
        { status: 400 },
      );
    }
    if (isOtpExpired(otpRecord.expiresAt)) {
      await prisma.otpCode.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, message: "Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª." },
        { status: 400 },
      );
    }
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, message: "ØªØ¹Ø¯Ø§Ø¯ ØªÙ„Ø§Ø´â€ŒÙ‡Ø§ÛŒ ØªØ£ÛŒÛŒØ¯ Ø¨ÛŒØ´ Ø§Ø² Ø­Ø¯ Ù…Ø¬Ø§Ø² Ø§Ø³Øª." },
        { status: 429 },
      );
    }
    const hashedCode = hashOtp(code);
    if (otpRecord.codeHash !== hashedCode) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { success: false, message: "Ú©Ø¯ ØªØ£ÛŒÛŒØ¯ ÙˆØ§Ø±Ø¯Ø´Ø¯Ù‡ Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª." },
        { status: 400 },
      );
    }
    let user;
    if (purpose === "REGISTER") {
      if (!otpRecord.fullName || !otpRecord.birthDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ù†Ø§Ù‚Øµ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ ÙØ±Ø§ÛŒÙ†Ø¯ Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ø±Ø§ Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø´Ø±ÙˆØ¹ Ú©Ù†ÛŒØ¯.",
          },
          { status: 400 },
        );
      }
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: phone },
      });
      if (existingUser) {
        await prisma.otpCode.delete({ where: { id: otpRecord.id } });
        return NextResponse.json(
          {
            success: false,
            message:
              "Ø­Ø³Ø§Ø¨ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† Ø§Ø² Ù‚Ø¨Ù„ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯. Ù„Ø·ÙØ§Ù‹ ÙˆØ§Ø±Ø¯ Ø­Ø³Ø§Ø¨ Ø®ÙˆØ¯ Ø´ÙˆÛŒØ¯.",
          },
          { status: 409 },
        );
      }
      user = await prisma.user.create({
        data: {
          phoneNumber: phone,
          fullName: otpRecord.fullName,
          birthDate: otpRecord.birthDate,
        },
      });
    } else {
      user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
      if (!user) {
        await prisma.otpCode.delete({ where: { id: otpRecord.id } });
        return NextResponse.json(
          {
            success: false,
            message:
              "Ø­Ø³Ø§Ø¨ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† ÛŒØ§ÙØª Ù†Ø´Ø¯. Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ú©Ù†ÛŒØ¯.",
          },
          { status: 404 },
        );
      }
    }
    await prisma.otpCode.delete({ where: { id: otpRecord.id } });
    const sessionToken = await createSession({
      userId: user.id,
      role: user.role,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return NextResponse.json({
      success: true,
      message:
        purpose === "REGISTER"
          ? "Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯."
          : "ÙˆØ±ÙˆØ¯ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§Ù†Ø¬Ø§Ù… Ø´Ø¯.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Ø®Ø·Ø§ÛŒ Ø¯Ø§Ø®Ù„ÛŒ Ø³Ø±ÙˆØ± Ø±Ø® Ø¯Ø§Ø¯." },
      { status: 500 },
    );
  }
}

```

---

