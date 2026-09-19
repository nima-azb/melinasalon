"use client";

import { Vazirmatn } from "next/font/google";
import { useEffect } from "react";

import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  display: "swap",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.variable}>
        <main className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-[var(--bg-cream)] px-6 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              مشکلی در سایت پیش آمد
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
              متأسفانه بارگذاری سایت با خطا مواجه شد. لطفاً دوباره تلاش کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-full bg-[var(--brand-crimson)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
          >
            تلاش مجدد
          </button>
        </main>
      </body>
    </html>
  );
}
