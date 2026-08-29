"use client";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Phone,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      {/* Card */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.08)] sm:p-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            ایجاد حساب کاربری
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            برای رزرو نوبت و استفاده از امکانات ملینا ثبت نام کنید.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5">
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
                placeholder="مثلاً  ملینا اردیانی"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
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
                placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              رمز عبور
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                placeholder="حداقل ۸ کاراکتر"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-11 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              تکرار رمز عبور
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                dir="ltr"
                placeholder="رمز عبور را دوباره وارد کنید"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3 pr-10 pl-11 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] hover:shadow-lg hover:shadow-[var(--brand-crimson)]/15"
          >
            <UserPlus size={17} />
            ایجاد حساب
          </button>
        </form>

        {/* Login */}
        <div className="mt-7 border-t border-[var(--border-subtle)] pt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            قبلاً حساب ساخته‌اید؟
            <Link
              href="/login"
              className="mr-1 font-semibold text-[var(--brand-crimson)] hover:underline"
            >
              وارد شوید
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
