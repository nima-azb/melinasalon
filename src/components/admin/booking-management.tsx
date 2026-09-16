"use client";

import { useCallback, useEffect, useState } from "react";

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Service = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phoneNumber: string;
    fullName?: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
};

type BookingsResponse = {
  success: boolean;
  bookings?: Booking[];
  message?: string;
};

type ServicesResponse = {
  success: boolean;
  services?: Service[];
  message?: string;
};

type SortField =
  | "appointment"
  | "createdAt"
  | "customer"
  | "service"
  | "status";

type SortDirection = "asc" | "desc";

const statusLabels: Record<BookingStatus, string> = {
  CONFIRMED: "تأیید شده",
  CANCELLED: "لغو شده",
  COMPLETED: "تکمیل شده",
};

const statusClasses: Record<BookingStatus, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-gray-100 text-gray-700",
};

const sortLabels: Record<SortField, string> = {
  appointment: "تاریخ و ساعت نوبت",
  createdAt: "تاریخ ثبت",
  customer: "مشتری",
  service: "خدمت",
  status: "وضعیت",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(dateString));
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [serviceId, setServiceId] = useState("");

  const [sort, setSort] = useState<SortField>("appointment");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (fromDate) {
        params.set("fromDate", fromDate);
      }

      if (toDate) {
        params.set("toDate", toDate);
      }

      if (status) {
        params.set("status", status);
      }

      if (serviceId) {
        params.set("serviceId", serviceId);
      }

      params.set("sort", sort);
      params.set("direction", direction);

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });

      const data: BookingsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load bookings.");
      }

      setBookings(data.bookings ?? []);
      setError(null);
    } catch (error) {
      console.error("Failed to load bookings:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, status, serviceId, sort, direction]);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const response = await fetch("/api/services?includeInactive=true", {
          cache: "no-store",
        });

        const data: ServicesResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load services.");
        }

        if (!cancelled) {
          setServices(data.services ?? []);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load services:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load services.",
        );
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBookings]);

  async function updateBookingStatus(
    bookingId: string,
    newStatus: "CANCELLED" | "COMPLETED",
  ) {
    try {
      setUpdatingBookingId(bookingId);
      setError(null);

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data: BookingsResponse & {
        booking?: Booking;
      } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update booking.");
      }

      await loadBookings();
    } catch (error) {
      console.error("Failed to update booking status:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update booking status.",
      );
    } finally {
      setUpdatingBookingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatus("");
    setServiceId("");
    setSort("appointment");
    setDirection("asc");
  }

  const hasFilters =
    search.trim() !== "" ||
    fromDate !== "" ||
    toDate !== "" ||
    status !== "" ||
    serviceId !== "";

  return (
    <section dir="rtl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          مدیریت نوبت‌ها
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          مشاهده، جستجو، فیلتر و مرتب‌سازی نوبت‌های ثبت‌شده
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <label
              htmlFor="booking-search"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              جستجوی مشتری
            </label>

            <input
              id="booking-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="نام یا شماره تماس مشتری..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="booking-from-date"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              از تاریخ
            </label>

            <input
              id="booking-from-date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="booking-to-date"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              تا تاریخ
            </label>

            <input
              id="booking-to-date"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
            />
          </div>

          <div>
            <label
              htmlFor="booking-status"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              وضعیت
            </label>

            <select
              id="booking-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BookingStatus | "")
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="CONFIRMED">تأیید شده</option>
              <option value="CANCELLED">لغو شده</option>
              <option value="COMPLETED">تکمیل شده</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="booking-service"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              خدمت
            </label>

            <select
              id="booking-service"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              disabled={loadingServices}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">همه خدمات</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="booking-sort"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              مرتب‌سازی بر اساس
            </label>

            <select
              id="booking-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortField)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
            >
              {(Object.keys(sortLabels) as SortField[]).map((field) => (
                <option key={field} value={field}>
                  {sortLabels[field]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="booking-direction"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              جهت مرتب‌سازی
            </label>

            <select
              id="booking-direction"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as SortDirection)
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
            >
              <option value="asc">صعودی</option>
              <option value="desc">نزولی</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-xl bg-[var(--brand-crimson)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "در حال دریافت..." : "اعمال فیلترها"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            disabled={
              !hasFilters && sort === "appointment" && direction === "asc"
            }
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              در حال دریافت نوبت‌ها...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              نوبتی با این فیلترها پیدا نشد.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-[var(--text-secondary)]">
              تعداد نوبت‌ها:{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {new Intl.NumberFormat("fa-IR").format(bookings.length)}
              </span>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => {
                const isUpdating = updatingBookingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          {booking.service.name}
                        </h3>

                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          مشتری: {booking.user.fullName || "بدون نام"}
                        </p>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          شماره تماس: {booking.user.phoneNumber}
                        </p>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {formatDate(booking.startsAt)}
                        </p>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          ساعت {formatTime(booking.startsAt)} تا{" "}
                          {formatTime(booking.endsAt)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClasses[booking.status]}`}
                      >
                        {statusLabels[booking.status]}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          مدت
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {new Intl.NumberFormat("fa-IR").format(
                            booking.service.duration,
                          )}{" "}
                          دقیقه
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          زمان ثبت
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>

                    {booking.status === "CONFIRMED" && (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void updateBookingStatus(booking.id, "COMPLETED")
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "در حال تغییر..." : "تکمیل شد"}
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            void updateBookingStatus(booking.id, "CANCELLED")
                          }
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "در حال تغییر..." : "لغو"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
