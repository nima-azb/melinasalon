"use client";

import {
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  AdminCreditsResponse,
  ProviderCreditStatus,
} from "@/app/api/admin/credits/route";

function StatusBadge({
  status,
  statusText,
}: {
  status: ProviderCreditStatus;
  statusText: string;
}) {
  switch (status) {
    case "ok":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {statusText}
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {statusText}
        </span>
      );
    case "depleted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {statusText}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {statusText}
        </span>
      );
  }
}

export function ServiceCredits() {
  const [data, setData] = useState<AdminCreditsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialCredits() {
      try {
        const res = await fetch("/api/admin/credits");
        const json = (await res.json()) as AdminCreditsResponse;

        if (!cancelled) {
          if (!res.ok || !json.success) {
            throw new Error(
              ("message" in json && typeof json.message === "string"
                ? json.message
                : null) || "خطا در دریافت اعتبار سرویس‌ها",
            );
          }
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در برقراری ارتباط با سرور برای دریافت اعتبار.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/credits?force=true");
      const json = (await res.json()) as AdminCreditsResponse;

      if (!res.ok || !json.success) {
        throw new Error(
          ("message" in json && typeof json.message === "string"
            ? json.message
            : null) || "خطا در دریافت اعتبار سرویس‌ها",
        );
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خطا در برقراری ارتباط با سرور برای دریافت اعتبار.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded bg-black/5" />
          <div className="h-6 w-20 animate-pulse rounded bg-black/5" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6" />
          <div className="h-44 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <div className="flex items-center justify-between">
          <span>{error || "امکان دریافت اعتبار سرویس‌ها وجود ندارد."}</span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 transition hover:bg-red-200 disabled:opacity-50"
          >
            {isRefreshing ? "در حال دریافت..." : "تلاش مجدد"}
          </button>
        </div>
      </div>
    );
  }

  const { avalai, melipayamak, hasLowBalanceWarning } = data;

  return (
    <div className="mt-6">
      {/* Header bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[var(--text-primary)]">
            شارژ و اعتبار سرویس‌های متصل
          </h3>
          <span className="text-xs text-[var(--text-secondary)]">
            (بروزرسانی زنده)
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)] disabled:opacity-50"
          title="بروزرسانی موجودی"
        >
          <RefreshCw
            size={13}
            className={
              isRefreshing ? "animate-spin text-[var(--brand-crimson)]" : ""
            }
          />
          <span>{isRefreshing ? "در حال دریافت..." : "بروزرسانی"}</span>
        </button>
      </div>

      {/* Low balance warning banner */}
      {hasLowBalanceWarning && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-800 shadow-sm sm:text-sm">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="flex-1">
            <strong>توجه مدیر سالن:</strong> اعتبار یکی از سرویس‌ها به پایان
            رسیده یا رو به اتمام است. جهت جلوگیری از اختلال در ارسال پیامک‌های
            نوبت یا ساخت تصاویر هوش مصنوعی، نسبت به افزایش موجودی اقدام فرمایید.
          </p>
        </div>
      )}

      {/* Credit cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Melipayamak Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    پنل پیامک (ملی‌پیامک)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    ارسال کدهای یکبارمصرف و یادآوری نوبت‌ها
                  </p>
                </div>
              </div>

              <StatusBadge
                status={melipayamak.status}
                statusText={melipayamak.statusText}
              />
            </div>

            <div className="mt-5 rounded-xl bg-[var(--bg-card-warm)] p-4">
              <span className="block text-xs font-medium text-[var(--text-secondary)]">
                موجودی باقیمانده پنل
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {melipayamak.displayValue}
                </span>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                  {melipayamak.unit}
                </span>
              </div>
            </div>

            {melipayamak.error && (
              <p className="mt-2 text-xs text-rose-600">{melipayamak.error}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <span className="text-xs text-[var(--text-secondary)]">
              ارائه‌دهنده: Melipayamak
            </span>

            <a
              href="https://console.melipayamak.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-crimson)] transition-colors hover:underline"
            >
              <span>شارژ پنل پیامک</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* AvalAI Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    سرویس هوش مصنوعی (AvalAI)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    تولید مدل مو و چهره آرایشگر مجازی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {avalai.accountTier > 0 && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    سطح {avalai.accountTier}
                  </span>
                )}
                <StatusBadge
                  status={avalai.status}
                  statusText={avalai.statusText}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[var(--bg-card-warm)] p-4">
              <span className="block text-xs font-medium text-[var(--text-secondary)]">
                اعتبار نقدی باقیمانده
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {avalai.formattedIrt}
                </span>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                  تومان
                </span>
              </div>
            </div>

            {avalai.error && (
              <p className="mt-2 text-xs text-rose-600">{avalai.error}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <span className="text-xs text-[var(--text-secondary)]">
              ارائه‌دهنده: AvalAI Platform
            </span>

            <a
              href="https://chat.avalai.ir/platform/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-crimson)] transition-colors hover:underline"
            >
              <span>شارژ حساب هوش مصنوعی</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
