"use client";

import { useEffect, useState } from "react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Service = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phoneNumber: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number | null;
  };
  timeSlot: {
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
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

const statusLabels: Record<BookingStatus, string> = {
  PENDING: "در انتظار تأیید",
  CONFIRMED: "تأیید شده",
  CANCELLED: "لغو شده",
  COMPLETED: "تکمیل شده",
};

const statusClasses: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-gray-100 text-gray-700",
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

function formatPrice(price: number | null) {
  if (price === null) {
    return "قیمت تعیین نشده";
  }

  return `${new Intl.NumberFormat("fa-IR").format(price)} تومان`;
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [serviceId, setServiceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (date) {
        params.set("date", date);
      }

      if (status) {
        params.set("status", status);
      }

      if (serviceId) {
        params.set("serviceId", serviceId);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/admin/bookings${queryString ? `?${queryString}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const data: BookingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load bookings.");
      }

      setBookings(data.bookings ?? []);
    } catch (error) {
      console.error("Failed to load bookings:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load bookings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetch("/api/services", {
          cache: "no-store",
        });

        const data: ServicesResponse = await response.json();

        if (!response.ok) {
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
    let cancelled = false;

    async function loadBookings() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();

        if (date) {
          params.set("date", date);
        }

        if (status) {
          params.set("status", status);
        }

        if (serviceId) {
          params.set("serviceId", serviceId);
        }

        const queryString = params.toString();

        const response = await fetch(
          `/api/admin/bookings${queryString ? `?${queryString}` : ""}`,
          {
            cache: "no-store",
          },
        );

        const data: BookingsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load bookings.");
        }

        if (!cancelled) {
          setBookings(data.bookings ?? []);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load bookings:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load bookings.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [date, status, serviceId]);

  async function updateBookingStatus(
    bookingId: string,
    newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED",
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

      await fetchBookings();
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
    setDate("");
    setStatus("");
    setServiceId("");
  }

  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          مدیریت نوبت‌ها
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          مشاهده، فیلتر و مدیریت وضعیت نوبت‌های ثبت‌شده
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="booking-date"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              تاریخ
            </label>

            <input
              id="booking-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
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
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING">در انتظار تأیید</option>
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
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">همه خدمات</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)]"
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
                        مشتری: {booking.user.phoneNumber}
                      </p>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {formatDate(booking.timeSlot.startsAt)}
                      </p>

                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        ساعت {formatTime(booking.timeSlot.startsAt)} تا{" "}
                        {formatTime(booking.timeSlot.endsAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClasses[booking.status]}`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-3">
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
                        مبلغ
                      </p>

                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                        {formatPrice(booking.service.price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        ظرفیت
                      </p>

                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                        {new Intl.NumberFormat("fa-IR").format(
                          booking.timeSlot.capacity,
                        )}
                      </p>
                    </div>
                  </div>

                  {booking.status === "PENDING" && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateBookingStatus(booking.id, "CONFIRMED")
                        }
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "در حال تغییر..." : "تأیید"}
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateBookingStatus(booking.id, "CANCELLED")
                        }
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "در حال تغییر..." : "لغو"}
                      </button>
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateBookingStatus(booking.id, "COMPLETED")
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "در حال تغییر..." : "تکمیل شد"}
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateBookingStatus(booking.id, "CANCELLED")
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
        )}
      </div>
    </section>
  );
}
