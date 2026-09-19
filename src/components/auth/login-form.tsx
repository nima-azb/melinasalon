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
        throw new Error(data.message || "خطا در ارسال کد");
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داد");
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
        throw new Error(data.message || "کد اشتباه است");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داد");
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
          aria-label="بازگشت به صفحه اصلی"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-crimson)] text-white shadow-[0_12px_30px_rgba(110,0,32,0.18)] transition-transform duration-300 group-hover:-translate-y-1">
            <Sparkles size={24} strokeWidth={1.8} />
          </div>

          <span className="text-2xl font-bold tracking-tight text-[var(--brand-crimson)]">
            ملینا
          </span>

          <span className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
            سالن زیبایی
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
              {step === "phone" ? "خوش آمدید" : "تایید شماره موبایل"}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {step === "phone"
                ? "برای ورود به حساب کاربری، شماره موبایل خود را وارد کنید."
                : `کد تایید ارسال‌شده به ${phone} را وارد کنید.`}
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
                  شماره موبایل
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
                    ورود با کد یکبارمصرف انجام می‌شود و نیازی به حفظ رمز عبور
                    ندارید.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="code"
                  className="mb-2.5 block text-sm font-semibold text-[var(--text-primary)]"
                >
                  کد تایید
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
                  <span>کد ارسال‌شده را وارد کنید</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                <span className="mt-0.5 shrink-0">●</span>
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
                  <span>لطفاً صبر کنید...</span>
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
                    {step === "phone" ? "دریافت کد تایید" : "ورود به حساب"}
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
                <span>تغییر شماره موبایل</span>
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-secondary)]">یا</span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          {/* Register */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-4 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              حساب کاربری ندارید؟
              <Link
                href="/register"
                className="mr-1.5 font-bold text-[var(--brand-crimson)] transition-colors hover:text-[var(--brand-crimson-hover)] hover:underline"
              >
                ثبت نام کنید
              </Link>
            </p>
          </div>
        </div>

        {/* Security footer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-6 py-4 sm:px-8">
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 size={15} className="text-[var(--brand-crimson)]" />

            <span>ورود امن و محافظت‌شده با کد یکبارمصرف</span>
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
          <span>بازگشت به صفحه اصلی</span>
        </Link>
      </div>
    </div>
  );
}
