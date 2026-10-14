"use client";

import {
  AlertCircle,
  CalendarX2,
  Clock,
  History,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { JalaliDatePicker } from "../ui/jalali-date-picker";

type Service = {
  id: string;
  name: string;
  isActive: boolean;
};

type BlockedTime = {
  id: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

type BlockedTimeForm = {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type BlockedTimesResponse = {
  success: boolean;
  message?: string;
  blockedTimes?: BlockedTime[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
};

type ServicesResponse = {
  success: boolean;
  message?: string;
  services?: Service[];
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatHourRange(startsAt: string, endsAt: string): string {
  const start = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));

  const end = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(endsAt));

  return `${start} تا ${end}`;
}

export function BlockedTimeManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [includePast, setIncludePast] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<BlockedTimeForm>({
    serviceId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    reason: "",
  });

  const loadBlockedTimes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (includePast) {
        params.set("includePast", "true");
      }

      const response = await fetch(
        `/api/admin/blocked-times?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as BlockedTimesResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "دریافت زمان‌های مسدود با خطا مواجه شد.",
        );
      }

      setBlockedTimes(data.blockedTimes ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? (data.blockedTimes?.length || 0));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت زمان‌های مسدود با خطا مواجه شد.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, includePast]);

  // Load services once
  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        setLoadingServices(true);
        const response = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as ServicesResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "دریافت خدمات با خطا مواجه شد.");
        }

        if (!cancelled) {
          const activeServices = data.services ?? [];
          setServices(activeServices);
          if (activeServices.length > 0) {
            setForm((current) => ({
              ...current,
              serviceId: current.serviceId || activeServices[0].id,
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "دریافت خدمات با خطا مواجه شد.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
        }
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch blocked times whenever page or includePast changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBlockedTimes();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBlockedTimes]);

  function updateForm(field: keyof BlockedTimeForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.serviceId) {
      setError("لطفاً خدمت مورد نظر را انتخاب کنید.");
      return;
    }

    if (!form.date) {
      setError("لطفاً تاریخ را انتخاب کنید.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("لطفاً زمان شروع و پایان را وارد کنید.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("زمان پایان باید بعد از زمان شروع باشد.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/blocked-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: form.serviceId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          reason: form.reason.trim() || undefined,
        }),
      });

      const data = (await response.json()) as BlockedTimesResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ثبت زمان مسدود با خطا مواجه شد.");
      }

      setSuccessMessage("زمان مسدود با موفقیت ثبت شد.");
      setForm((current) => ({
        ...current,
        reason: "",
      }));

      await loadBlockedTimes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ثبت زمان مسدود با خطا مواجه شد.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("آیا از حذف این بازه مسدود اطمینان دارید؟")) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      setDeletingId(id);

      const response = await fetch(`/api/admin/blocked-times/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "حذف زمان مسدود با خطا مواجه شد.");
      }

      setSuccessMessage("زمان مسدود حذف شد و مجدداً قابل رزرو است.");
      await loadBlockedTimes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حذف زمان مسدود با خطا مواجه شد.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form: Add New Blocked Time */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[var(--brand-crimson)]">
              <CalendarX2 size={18} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                مسدودسازی ساعت یا تاریخ
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                جلوگیری از رزرو آنلاین برای یک خدمت خاص
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                انتخاب خدمت سالن
              </label>
              <select
                value={form.serviceId}
                onChange={(e) => updateForm("serviceId", e.target.value)}
                disabled={loadingServices || creating || services.length === 0}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
              >
                <option value="">
                  {loadingServices ? "در حال دریافت خدمات..." : "انتخاب خدمت"}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                تاریخ مسدودی
              </label>
              <JalaliDatePicker
                value={form.date}
                onChange={(date) => updateForm("date", date)}
                placeholder="انتخاب تاریخ"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                  از ساعت
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => updateForm("startTime", e.target.value)}
                  disabled={creating}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                  تا ساعت
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => updateForm("endTime", e.target.value)}
                  disabled={creating}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
                علت مسدودی (اختیاری)
              </label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => updateForm("reason", e.target.value)}
                disabled={creating}
                placeholder="مثلاً مرخصی پرسنل، تعمیرات، جلسه..."
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-crimson)]"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-crimson)] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)] disabled:opacity-50"
            >
              <Plus size={15} />
              <span>{creating ? "در حال ثبت..." : "ثبت بازه مسدود جدید"}</span>
            </button>
          </form>
        </div>

        {/* List of Active Blocked Times */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                  زمان‌های مسدود ثبت‌شده
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {includePast
                    ? "تمام ساعات غیرقابل رزرو (شامل گذشته)"
                    : "ساعات غیرقابل رزرو از امروز به بعد"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncludePast(!includePast);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    includePast
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                  title="نمایش سوابق گذشته"
                >
                  <History
                    size={13}
                    className={includePast ? "text-amber-600" : ""}
                  />
                  <span>
                    {includePast ? "شامل سوابق گذشته" : "فقط زمان‌های آینده"}
                  </span>
                </button>

                <span className="rounded-full bg-[var(--bg-card-warm)] px-2.5 py-1 text-xs font-bold text-[var(--brand-crimson)]">
                  {totalCount.toLocaleString("fa-IR")} بازه
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading && blockedTimes.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-2xl bg-[var(--bg-card-warm)]"
                    />
                  ))}
                </div>
              ) : blockedTimes.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarX2
                    size={32}
                    className="mx-auto text-[var(--text-secondary)] opacity-40"
                  />
                  <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">
                    {includePast
                      ? "هیچ بازه مسدودی در سوابق ثبت نشده است."
                      : "در حال حاضر هیچ بازه مسدودی برای امروز و آینده وجود ندارد."}
                  </p>
                  {!includePast && (
                    <button
                      type="button"
                      onClick={() => {
                        setIncludePast(true);
                        setPage(1);
                      }}
                      className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[var(--bg-card-warm)] px-3 py-1.5 text-xs font-bold text-[var(--brand-crimson)] hover:bg-[var(--brand-crimson-light)]"
                    >
                      <History size={13} />
                      <span>مشاهده بازه‌های مسدود گذشته</span>
                    </button>
                  )}
                </div>
              ) : (
                blockedTimes.map((bt) => {
                  const isDeleting = deletingId === bt.id;

                  return (
                    <div
                      key={bt.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4 transition hover:border-[var(--brand-crimson-light)]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-[var(--brand-crimson-light)] px-2 py-0.5 text-xs font-bold text-[var(--brand-crimson)]">
                            {bt.service.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--text-primary)]">
                            <Clock
                              size={12}
                              className="text-[var(--brand-crimson)]"
                            />
                            {formatHourRange(bt.startsAt, bt.endsAt)}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                          <span>
                            تاریخ:{" "}
                            {formatDateTime(bt.startsAt).split(" ساعت")[0]}
                          </span>
                          {bt.reason && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-[var(--text-primary)]">
                                علت: {bt.reason}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(bt.id)}
                        disabled={isDeleting}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                        title="آزادسازی این زمان"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 border-t border-[var(--border-subtle)] pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
              >
                ← صفحه قبل
              </button>

              <span className="text-xs font-bold text-[var(--text-secondary)]">
                صفحه {page.toLocaleString("fa-IR")} از{" "}
                {totalPages.toLocaleString("fa-IR")}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
              >
                صفحه بعد →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
