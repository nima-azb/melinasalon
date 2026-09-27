"use client";

import { useEffect, useState } from "react";

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

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  services?: T[];
  blockedTimes?: T[];
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BlockedTimeManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<BlockedTimeForm>({
    serviceId: "",
    date: "",
    startTime: "07:00",
    endTime: "08:00",
    reason: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setLoadingServices(true);
        setError("");

        const [servicesResponse, blockedTimesResponse] = await Promise.all([
          fetch("/api/services", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/admin/blocked-times", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const servicesData =
          (await servicesResponse.json()) as ApiResponse<Service>;

        const blockedTimesData =
          (await blockedTimesResponse.json()) as ApiResponse<BlockedTime>;

        if (cancelled) {
          return;
        }

        if (!servicesResponse.ok || !servicesData.success) {
          throw new Error(
            servicesData.message || "دریافت خدمات با خطا مواجه شد.",
          );
        }

        if (!blockedTimesResponse.ok || !blockedTimesData.success) {
          throw new Error(
            blockedTimesData.message ||
              "دریافت زمان‌های مسدود با خطا مواجه شد.",
          );
        }

        const activeServices = servicesData.services ?? [];
        const loadedBlockedTimes = blockedTimesData.blockedTimes ?? [];

        setServices(activeServices);
        setBlockedTimes(loadedBlockedTimes);

        if (activeServices.length > 0) {
          setForm((current) => ({
            ...current,
            serviceId: current.serviceId || activeServices[0].id,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load blocked-time data:", error);

          setError(
            error instanceof Error
              ? error.message
              : "دریافت اطلاعات با خطا مواجه شد.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingServices(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadBlockedTimes() {
    try {
      const response = await fetch("/api/admin/blocked-times", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse<BlockedTime>;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "دریافت زمان‌های مسدود با خطا مواجه شد.",
        );
      }

      setBlockedTimes(data.blockedTimes ?? []);
    } catch (error) {
      console.error("Failed to reload blocked times:", error);

      setError(
        error instanceof Error
          ? error.message
          : "دریافت زمان‌های مسدود با خطا مواجه شد.",
      );
    }
  }

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
      setError("لطفاً خدمت را انتخاب کنید.");
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

      const data = (await response.json()) as ApiResponse<BlockedTime>;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ثبت زمان مسدود با خطا مواجه شد.");
      }

      setSuccessMessage(data.message || "زمان مسدود با موفقیت ثبت شد.");

      setForm((current) => ({
        ...current,
        startTime: "07:00",
        endTime: "08:00",
        reason: "",
      }));

      await loadBlockedTimes();
    } catch (error) {
      console.error("Failed to create blocked time:", error);

      setError(
        error instanceof Error
          ? error.message
          : "ثبت زمان مسدود با خطا مواجه شد.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("آیا از حذف این زمان مسدود مطمئن هستید؟");

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      setDeletingId(id);

      const response = await fetch(`/api/admin/blocked-times/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "حذف زمان مسدود با خطا مواجه شد.");
      }

      setSuccessMessage(data.message || "زمان مسدود حذف شد.");

      await loadBlockedTimes();
    } catch (error) {
      console.error("Failed to delete blocked time:", error);

      setError(
        error instanceof Error
          ? error.message
          : "حذف زمان مسدود با خطا مواجه شد.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section dir="rtl" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          زمان‌های غیرقابل رزرو
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          بازه‌ای را برای یک خدمت مشخص مسدود کنید. این بازه فقط روی همان خدمت
          تأثیر می‌گذارد و سایر خدمات همچنان قابل رزرو خواهند بود.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="blocked-service"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              خدمت
            </label>

            <select
              id="blocked-service"
              value={form.serviceId}
              onChange={(event) => updateForm("serviceId", event.target.value)}
              disabled={loadingServices || creating || services.length === 0}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            >
              <option value="">
                {loadingServices ? "در حال دریافت خدمات..." : "انتخاب خدمت"}
              </option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            {services.length === 0 && !loadingServices ? (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                هیچ خدمت فعالی برای انتخاب وجود ندارد.
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="blocked-date"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              تاریخ
            </label>

            <input
              id="blocked-date"
              type="date"
              value={form.date}
              onChange={(event) => updateForm("date", event.target.value)}
              disabled={creating}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div />

          <div>
            <label
              htmlFor="blocked-start-time"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              زمان شروع
            </label>

            <input
              id="blocked-start-time"
              type="time"
              min="07:00"
              max="23:30"
              step={30 * 60}
              value={form.startTime}
              onChange={(event) => updateForm("startTime", event.target.value)}
              disabled={creating}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="blocked-end-time"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              زمان پایان
            </label>

            <input
              id="blocked-end-time"
              type="time"
              min="07:30"
              max="24:00"
              step={30 * 60}
              value={form.endTime}
              onChange={(event) => updateForm("endTime", event.target.value)}
              disabled={creating}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="blocked-reason"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              دلیل
              <span className="mr-1 text-xs font-normal text-[var(--text-secondary)]">
                (اختیاری)
              </span>
            </label>

            <textarea
              id="blocked-reason"
              value={form.reason}
              onChange={(event) => updateForm("reason", event.target.value)}
              maxLength={500}
              rows={3}
              disabled={creating}
              placeholder="مثلاً جلسه، مرخصی، تعمیرات و..."
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-crimson)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={
              creating ||
              loadingServices ||
              !form.serviceId ||
              services.length === 0
            }
            className="rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "در حال ثبت..." : "ثبت زمان مسدود"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <h3 className="font-semibold text-[var(--text-primary)]">
            زمان‌های مسدود ثبت‌شده
          </h3>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            در حال دریافت اطلاعات...
          </div>
        ) : blockedTimes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            هنوز زمان مسدودی ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {blockedTimes.map((blockedTime) => (
              <div
                key={blockedTime.id}
                className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--bg-card-warm)] px-3 py-1 text-sm font-medium text-[var(--text-primary)]">
                      {blockedTime.service.name}
                    </span>

                    {!blockedTime.service.isActive ? (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        غیرفعال
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {formatDateTime(blockedTime.startsAt)}
                    {" تا "}
                    {new Intl.DateTimeFormat("fa-IR", {
                      timeZone: "Asia/Tehran",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(blockedTime.endsAt))}
                  </p>

                  {blockedTime.reason ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {blockedTime.reason}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(blockedTime.id)}
                  disabled={deletingId === blockedTime.id}
                  className="shrink-0 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === blockedTime.id ? "در حال حذف..." : "حذف"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
