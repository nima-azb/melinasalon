"use client";

import { LogIn, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="w-full max-w-md">
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
            سالن زیبایی
          </span>
        </Link>
      </div>

      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.08)] sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            خوش آمدید
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {step === "phone"
              ? "شماره موبایل خود را وارد کنید."
              : "کد تایید ارسال شده را وارد کنید."}
          </p>
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();

            if (step === "phone") {
              sendOtp();
            } else {
              verifyOtp();
            }
          }}
        >
          {step === "phone" ? (
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
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                کد تایید
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 px-4 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] disabled:opacity-60"
          >
            {step === "otp" ? <LogIn size={17} /> : <ArrowRight size={17} />}

            {loading
              ? "لطفا صبر کنید..."
              : step === "phone"
                ? "دریافت کد"
                : "ورود به حساب"}
          </button>

          {step === "otp" && (
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
              }}
              className="w-full text-sm text-[var(--brand-crimson)]"
            >
              تغییر شماره موبایل
            </button>
          )}
        </form>

        <div className="mt-7 border-t border-[var(--border-subtle)] pt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            حساب کاربری ندارید؟
            <Link
              href="/register"
              className="mr-1 font-semibold text-[var(--brand-crimson)] hover:underline"
            >
              ثبت نام کنید
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-crimson)]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
