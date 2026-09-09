"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "details" | "otp";

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("نام و نام خانوادگی واردشده بیش از حد طولانی است.");
      return;
    }

    if (!birthDate) {
      setError("لطفاً تاریخ تولد خود را وارد کنید.");
      return;
    }

    if (!trimmedPhone) {
      setError("لطفاً شماره موبایل خود را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose: "register",
          fullName: trimmedName,
          birthDate,
          phone: trimmedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ===
            "An account with this phone number already exists. Please log in."
            ? "با این شماره موبایل قبلاً حساب کاربری ایجاد شده است. لطفاً وارد حساب خود شوید."
            : data.message === "Please wait before requesting another code."
              ? "لطفاً برای دریافت کد جدید کمی صبر کنید."
              : "ارسال کد تأیید با مشکل مواجه شد. لطفاً دوباره تلاش کنید.",
        );
        return;
      }

      setStep("otp");
      setSuccess("کد تأیید به شماره موبایل شما ارسال شد.");
    } catch {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedCode = code.trim();

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("لطفاً کد تأیید ۶ رقمی را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose: "register",
          phone: phone.trim(),
          code: trimmedCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ===
            "An account with this phone number already exists. Please log in."
            ? "با این شماره موبایل قبلاً حساب کاربری ایجاد شده است. لطفاً وارد حساب خود شوید."
            : data.message === "The verification code has expired."
              ? "کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید."
              : data.message === "Too many verification attempts."
                ? "تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً کد جدید دریافت کنید."
                : data.message === "Incorrect verification code."
                  ? "کد تأیید واردشده صحیح نیست."
                  : "تأیید شماره موبایل با مشکل مواجه شد. لطفاً دوباره تلاش کنید.",
        );
        return;
      }

      setSuccess("حساب کاربری شما با موفقیت ایجاد شد.");

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  function goBackToDetails() {
    setError("");
    setSuccess("");
    setCode("");
    setStep("details");
  }

  return (
    <div dir="rtl" className="w-full max-w-md">
      {/* Brand */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex flex-col items-center transition-opacity hover:opacity-80"
        >
          <span className="text-2xl font-bold text-[var(--brand-crimson)]">
            ملینا
          </span>

          <span className="mt-1 text-xs text-[var(--text-secondary)]">
            سالن زیبایی ملینا
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.08)] sm:p-8">
        {/* Heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-crimson)]/10 text-[var(--brand-crimson)]">
            {step === "details" ? (
              <UserPlus size={22} />
            ) : (
              <CheckCircle2 size={22} />
            )}
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {step === "details" ? "ایجاد حساب کاربری" : "تأیید شماره موبایل"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {step === "details"
              ? "برای ایجاد حساب کاربری، اطلاعات خود را وارد کنید."
              : `کد تأیید به شماره ${phone} ارسال شد.`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
          >
            {success}
          </div>
        )}

        {step === "details" ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                نام و نام خانوادگی
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="نام و نام خانوادگی خود را وارد کنید"
                  disabled={loading}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Birth date */}
            <div>
              <label
                htmlFor="birthDate"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                تاریخ تولد
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                />

                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  autoComplete="bday"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={loading}
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                شماره موبایل
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
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
                  disabled={loading}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                کد تأیید به این شماره ارسال خواهد شد.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] hover:shadow-lg hover:shadow-[var(--brand-crimson)]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  در حال ارسال کد...
                </>
              ) : (
                <>
                  ادامه
                  <ArrowLeft size={17} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
            {/* OTP */}
            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                کد تأیید
              </label>

              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="۱۲۳۴۵۶"
                disabled={loading}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-4 text-center text-xl font-semibold tracking-[0.35em] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/40 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
                کد ۶ رقمی ارسال‌شده به شماره موبایل خود را وارد کنید.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] hover:shadow-lg hover:shadow-[var(--brand-crimson)]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  تأیید و ایجاد حساب
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goBackToDetails}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft size={16} />
              تغییر اطلاعات
            </button>
          </form>
        )}

        {/* Login */}
        <div className="mt-7 border-t border-[var(--border-subtle)] pt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            قبلاً حساب کاربری دارید؟
            <Link
              href="/login"
              className="mr-1 font-semibold text-[var(--brand-crimson)] hover:underline"
            >
              ورود به حساب
            </Link>
          </p>
        </div>
      </div>

      {/* Back to homepage */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
