"use client";

import { Ban, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Booking = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    duration: number;
  };
};

type MyBookingsProps = {
  bookings: Booking[];
};

type CancelBookingResponse = {
  success: boolean;
  message?: string;
};

type TabId = "active" | "history" | "cancelled";

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

function isFutureBooking(booking: Booking) {
  return new Date(booking.startsAt).getTime() >= Date.now();
}

export function MyBookings({ bookings: initialBookings }: MyBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const { activeBookings, historyBookings, cancelledBookings } = useMemo(() => {
    const active: Booking[] = [];
    const history: Booking[] = [];
    const cancelled: Booking[] = [];

    for (const booking of bookings) {
      if (booking.status === "CANCELLED") {
        cancelled.push(booking);
      } else if (booking.status === "COMPLETED" || !isFutureBooking(booking)) {
        history.push(booking);
      } else {
        active.push(booking);
      }
    }

    active.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    history.sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );

    cancelled.sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );

    return {
      activeBookings: active,
      historyBookings: history,
      cancelledBookings: cancelled,
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

      if (!response.ok || !data.success) {
        throw new Error(data.message || "لغو نوبت انجام نشد.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "CANCELLED",
                updatedAt: new Date().toISOString(),
              }
            : booking,
        ),
      );
    } catch (cancelError) {
      console.error("Failed to cancel booking:", cancelError);

      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "لغو نوبت با خطا مواجه شد.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  function renderBooking(booking: Booking) {
    const canCancel =
      booking.status === "CONFIRMED" && isFutureBooking(booking);

    return (
      <div
        key={booking.id}
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <CalendarDays size={19} />
            </span>

            <div>
              <h4 className="font-bold text-[var(--text-primary)]">
                {booking.service.name}
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {formatDate(booking.startsAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
              <Clock3 size={13} />
              {formatTime(booking.startsAt)} تا {formatTime(booking.endsAt)}
            </span>
          </div>
        </div>

        {canCancel && (
          <div className="mt-4 flex justify-end border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => void handleCancel(booking.id)}
              disabled={cancellingId === booking.id}
              className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancellingId === booking.id ? "در حال لغو..." : "لغو نوبت"}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderEmptyState(message: string) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-8 text-center text-sm text-[var(--text-secondary)]">
        {message}
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "active", label: "پیش‌رو", count: activeBookings.length },
    { id: "history", label: "تاریخچه نوبت‌ها", count: historyBookings.length },
    { id: "cancelled", label: "لغوشده", count: cancelledBookings.length },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-[var(--brand-crimson)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            نوبت‌های من
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-[var(--bg-card-warm)] p-1 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                activeTab === tab.id
                  ? "bg-[var(--brand-crimson)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--brand-crimson)]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "active" &&
        (activeBookings.length > 0 ? (
          <div className="space-y-3">{activeBookings.map(renderBooking)}</div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-8 text-center">
            <p className="font-semibold text-[var(--text-primary)]">
              هنوز نوبت آینده‌ای ندارید
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              برای رزرو خدمات موردنظرتان می‌توانید از صفحه رزرو نوبت استفاده
              کنید.
            </p>
            <Link
              href="/#booking"
              className="mt-5 inline-flex rounded-full bg-[var(--brand-crimson)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
            >
              رزرو نوبت
            </Link>
          </div>
        ))}

      {activeTab === "history" &&
        (historyBookings.length > 0 ? (
          <div className="space-y-3">{historyBookings.map(renderBooking)}</div>
        ) : (
          renderEmptyState("هنوز سابقه نوبتی ندارید.")
        ))}

      {activeTab === "cancelled" &&
        (cancelledBookings.length > 0 ? (
          <div className="space-y-3">
            {cancelledBookings.map(renderBooking)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-8 text-center text-sm text-[var(--text-secondary)]">
            <Ban size={20} className="text-[var(--text-secondary)]" />
            نوبت لغوشده‌ای ندارید.
          </div>
        ))}
    </section>
  );
}
