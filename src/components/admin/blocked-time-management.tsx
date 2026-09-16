"use client";

import { useCallback, useEffect, useState } from "react";

type BlockedTime = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
};

type BlockedTimesResponse = {
  success: boolean;
  blockedTimes?: BlockedTime[];
  message?: string;
};

type CreateBlockedTimeResponse = {
  success: boolean;
  blockedTime?: BlockedTime;
  message?: string;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitialDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

export function BlockedTimeManagement() {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [date, setDate] = useState(getInitialDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [reason, setReason] = useState("");

  const loadBlockedTimes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/blocked-times", {
        method: "GET",
        cache: "no-store",
      });

      const data: BlockedTimesResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در دریافت زمان‌های مسدود");
      }

      setBlockedTimes(data.blockedTimes ?? []);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "خطا در دریافت زمان‌های مسدود",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBlockedTimes();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBlockedTimes]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/blocked-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          reason: reason.trim(),
        }),
      });

      const data: CreateBlockedTimeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در ایجاد زمان مسدود");
      }

      setSuccessMessage("زمان موردنظر با موفقیت مسدود شد.");
      setReason("");

      await loadBlockedTimes();
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "خطا در ایجاد زمان مسدود",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("آیا از حذف این زمان مسدود مطمئن هستید؟");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/blocked-times/${id}`, {
        method: "DELETE",
      });

      const data: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در حذف زمان مسدود");
      }

      setBlockedTimes((current) =>
        current.filter((blockedTime) => blockedTime.id !== id),
      );

      setSuccessMessage("زمان مسدود با موفقیت حذف شد.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "خطا در حذف زمان مسدود",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[0_20px_60px_rgba(36,20,23,0.06)] sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          زمان‌های غیرقابل رزرو
        </h2>

        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          بازه‌هایی را که امکان پذیرش نوبت در آن‌ها وجود ندارد، مسدود کنید. این
          بازه‌ها در سیستم رزرو کاربران نیز در دسترس نخواهند بود.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="blocked-date"
              className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
            >
              تاریخ
            </label>

            <input
              id="blocked-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-start-time"
              className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
            >
              شروع
            </label>

            <input
              id="blocked-start-time"
              type="time"
              min="10:00"
              max="21:30"
              step="1800"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-end-time"
              className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
            >
              پایان
            </label>

            <input
              id="blocked-end-time"
              type="time"
              min="10:30"
              max="22:00"
              step="1800"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-reason"
              className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
            >
              دلیل
            </label>

            <input
              id="blocked-reason"
              type="text"
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="مثلاً جلسه، تعطیلی یا زمان استراحت"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-crimson)]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--text-secondary)]">
            ساعت کاری سالن ۱۰:۰۰ تا ۲۲:۰۰ است و زمان‌ها باید روی بازه‌های ۳۰
            دقیقه‌ای باشند.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "در حال ثبت..." : "مسدود کردن زمان"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            بازه‌های مسدود شده
          </h3>

          <button
            type="button"
            onClick={() => void loadBlockedTimes()}
            disabled={isLoading}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            بروزرسانی
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            در حال دریافت زمان‌های مسدود...
          </div>
        ) : blockedTimes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              هیچ زمان مسدودی ثبت نشده است.
            </p>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              بازه‌های غیرقابل رزرو از این بخش اضافه می‌شوند.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {blockedTimes.map((blockedTime) => (
              <article
                key={blockedTime.id}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[var(--brand-crimson)]/10 px-2.5 py-1 text-sm font-bold text-[var(--brand-crimson)]">
                      {formatDate(blockedTime.startsAt)}
                    </span>

                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatTime(blockedTime.startsAt)}
                      {" تا "}
                      {formatTime(blockedTime.endsAt)}
                    </span>
                  </div>

                  {blockedTime.reason ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {blockedTime.reason}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      بدون توضیح
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(blockedTime.id)}
                  disabled={deletingId === blockedTime.id}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === blockedTime.id ? "در حال حذف..." : "حذف"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
