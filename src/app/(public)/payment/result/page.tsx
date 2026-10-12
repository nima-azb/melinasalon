"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Receipt,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatTomanPrice } from "@/lib/payment/config";

type VerifyResponse = {
  success: boolean;
  message?: string;
  payment?: {
    refId: string;
    amount: number;
    cardPan?: string;
  };
  booking?: {
    id: string;
    serviceName: string;
    startsAt: string;
  };
};

function formatPersianDateTime(dateString: string) {
  const date = new Date(dateString);
  const dateFormatted = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeFormatted = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return { date: dateFormatted, time: timeFormatted };
}

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const authority =
    searchParams.get("Authority") || searchParams.get("authority");
  const status = searchParams.get("Status") || searchParams.get("status");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [countdown, setCountdown] = useState(5);
  const hasRequestedVerification = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function doVerify() {
      if (!authority) {
        setLoading(false);
        setData({
          success: false,
          message: "شناسه تراکنش نامعتبر است یا یافت نشد.",
        });
        return;
      }

      // جلوگیری از اجرای دوبار متوالی در محیط React StrictMode
      if (hasRequestedVerification.current) {
        return;
      }
      hasRequestedVerification.current = true;

      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authority, status }),
        });

        const result: VerifyResponse = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setData({
            success: false,
            message:
              err instanceof Error
                ? err.message
                : "خطای ناشناخته در بررسی وضعیت پرداخت.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void doVerify();

    return () => {
      cancelled = true;
    };
  }, [authority, status]);

  // شمارش معکوس برای بازگشت به پنل کاربری در صورت موفقیت پرداخت
  useEffect(() => {
    if (!data?.success) {
      return;
    }

    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, countdown, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-crimson)]/10 text-[var(--brand-crimson)]">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
          در حال بررسی و اعتبارسنجی پرداخت...
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          لطفاً چند لحظه شکیبا باشید و صفحه را نبندید.
        </p>
      </div>
    );
  }

  const isSuccess = Boolean(data?.success);
  const dateTime = data?.booking?.startsAt
    ? formatPersianDateTime(data.booking.startsAt)
    : null;

  return (
    <div className="mx-auto my-12 max-w-xl px-4 sm:my-16">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.08)] sm:p-10">
        {/* هدر وضعیت */}
        <div className="text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              isSuccess
                ? "bg-green-100 text-green-600 ring-8 ring-green-50"
                : "bg-red-100 text-red-600 ring-8 ring-red-50"
            }`}
          >
            {isSuccess ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
          </div>

          <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
            {isSuccess ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود"}
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {isSuccess
              ? "نوبت شما با موفقیت ثبت شد و پیامک تایید برای شما ارسال گردید."
              : data?.message ||
                "تراکنش لغو شد یا در ارتباط با بانک خطایی رخ داد."}
          </p>
        </div>

        {/* جزئیات پرداخت موفق */}
        {isSuccess && data?.payment && (
          <div className="mt-8 space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-5 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]/60">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Receipt size={16} />
                کد رهگیری بانکی
              </span>
              <span className="font-mono font-bold text-[var(--text-primary)] dir-ltr">
                {data.payment.refId}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]/60">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <CreditCard size={16} />
                مبلغ بیعانه
              </span>
              <span className="font-bold text-[var(--brand-crimson)]">
                {formatTomanPrice(data.payment.amount)}
              </span>
            </div>

            {data.booking && (
              <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]/60">
                <span className="text-[var(--text-secondary)]">
                  خدمت انتخابی
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {data.booking.serviceName}
                </span>
              </div>
            )}

            {dateTime && (
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Clock size={16} />
                  زمان نوبت
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {dateTime.date} - ساعت {dateTime.time}
                </span>
              </div>
            )}
          </div>
        )}

        {/* دکمه‌ها و انتقال به داشبورد */}
        <div className="mt-8">
          {isSuccess ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] shadow-md"
              >
                <span>مشاهده نوبت در پنل کاربری</span>
                <ArrowLeft size={16} />
              </Link>

              <p className="text-center text-xs text-[var(--text-secondary)]">
                در حال انتقال خودکار به پنل کاربری تا{" "}
                <span className="font-bold text-[var(--brand-crimson)]">
                  {countdown}
                </span>{" "}
                ثانیه دیگر...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/#booking"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)]"
              >
                <span>بازگشت به نوبت‌دهی و تلاش مجدد</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2
            size={32}
            className="animate-spin text-[var(--brand-crimson)]"
          />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
