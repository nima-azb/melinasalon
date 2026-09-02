"use client";

import { useEffect, useMemo, useState } from "react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Booking = {
  id: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
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

type CancelBookingResponse = {
  success: boolean;
  booking?: Booking;
  message?: string;
};

const statusLabels: Record<BookingStatus, string> = {
  PENDING: "در انتظار تأیید",
  CONFIRMED: "تأیید شده",
  CANCELLED: "لغو شده",
  COMPLETED: "تکمیل شده",
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

function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
  }
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBookings() {
      try {
        const response = await fetch("/api/bookings", {
          method: "GET",
          cache: "no-store",
        });

        const data: BookingsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load bookings.");
        }

        if (cancelled) {
          return;
        }

        setBookings(data.bookings ?? []);
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

    void fetchBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();

    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const booking of bookings) {
      const startsAt = new Date(booking.timeSlot.startsAt);

      if (startsAt >= now) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    }

    return {
      upcomingBookings: upcoming,
      pastBookings: past.reverse(),
    };
  }, [bookings]);

  async function handleCancel(bookingId: string) {
    const confirmed = window.confirm(
      "آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setError(null);

      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      const data: CancelBookingResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel booking.");
      }

      if (data.booking) {
        setBookings((currentBookings) =>
          currentBookings.map((booking) =>
            booking.id === data.booking?.id ? data.booking : booking,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);

      setError(
        error instanceof Error ? error.message : "Failed to cancel booking.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  function renderBooking(booking: Booking) {
    const canCancel =
      booking.status === "PENDING" || booking.status === "CONFIRMED";

    return (
      <div
        key={booking.id}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {booking.service.name}
            </h3>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatDate(booking.timeSlot.startsAt)}
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              ساعت {formatTime(booking.timeSlot.startsAt)} تا{" "}
              {formatTime(booking.timeSlot.endsAt)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
              booking.status,
            )}`}
          >
            {statusLabels[booking.status]}
          </span>
        </div>

        <div className="mt-5 grid gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">مدت خدمات</p>

            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {new Intl.NumberFormat("fa-IR").format(booking.service.duration)}{" "}
              دقیقه
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)]">مبلغ</p>

            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {formatPrice(booking.service.price)}
            </p>
          </div>
        </div>

        {canCancel && (
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => void handleCancel(booking.id)}
              disabled={cancellingId === booking.id}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancellingId === booking.id ? "در حال لغو..." : "لغو نوبت"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <section className="mt-8">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            در حال دریافت نوبت‌ها...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          نوبت‌های من
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          نوبت‌های آینده و سوابق نوبت‌های شما
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            نوبت‌های آینده
          </h3>

          <div className="space-y-4">{upcomingBookings.map(renderBooking)}</div>
        </div>
      )}

      {upcomingBookings.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            در حال حاضر نوبت آینده‌ای ندارید.
          </p>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            سوابق نوبت‌ها
          </h3>

          <div className="space-y-4">{pastBookings.map(renderBooking)}</div>
        </div>
      )}
    </section>
  );
}
