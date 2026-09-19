"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function ErrorScreen({
  error,
  reset,
  title = "مشکلی پیش آمد",
  description = "بارگذاری این بخش با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5 bg-[var(--bg-cream)] px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={28} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[var(--brand-crimson)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
        >
          تلاش مجدد
        </button>

        <Link
          href={homeHref}
          className="rounded-full border border-[var(--border-beige)] bg-[var(--bg-card)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
