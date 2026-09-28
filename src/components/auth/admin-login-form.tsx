"use client";

import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get("phone") ?? "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "رمز عبور صحیح نیست.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی هنگام ورود رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[440px]">
      {/* Header */}
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-crimson)] text-white shadow-[0_12px_30px_rgba(110,0,32,0.18)]">
          <ShieldCheck size={25} strokeWidth={1.8} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-crimson)]">
          ورود مدیر
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          برای ورود به پنل مدیریت رمز عبور خود را وارد کنید.
        </p>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_25px_80px_rgba(36,20,23,0.10)]">
        <div className="h-1 w-full bg-[var(--brand-crimson)]" />

        <div className="p-6 sm:p-8">
          {phone && (
            <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                حساب مدیر شناسایی شد
              </p>

              <p
                dir="ltr"
                className="mt-1 text-sm font-semibold text-[var(--text-primary)]"
              >
                {phone}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2.5 block text-sm font-semibold text-[var(--text-primary)]"
              >
                رمز عبور مدیر
              </label>

              <div className="group relative">
                <LockKeyhole
                  size={18}
                  strokeWidth={1.8}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--brand-crimson)]"
                />

                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="رمز عبور"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-3.5 pl-4 pr-11 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--brand-crimson)]/6 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            )}

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
                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />

                  <span>ورود به پنل مدیریت</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-6 py-4 sm:px-8">
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldCheck size={15} className="text-[var(--brand-crimson)]" />

            <span>ورود مدیر بدون ارسال پیامک انجام می‌شود.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
