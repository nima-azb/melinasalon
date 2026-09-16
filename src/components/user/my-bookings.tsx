"use client";

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

const statusLabels: Record<BookingStatus, string> = {
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

function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
  }
}

function isFutureBooking(booking: Booking) {
  return new Date(booking.startsAt).getTime() >= Date.now();
}

export function MyBookings({ bookings: initialBookings }: MyBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const booking of bookings) {
      if (isFutureBooking(booking)) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    }

    upcoming.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    past.sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );

    return {
      upcomingBookings: upcoming,
      pastBookings: past,
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
    } catch (error) {
      console.error("Failed to cancel booking:", error);

      setError(
        error instanceof Error ? error.message : "لغو نوبت با خطا مواجه شد.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  function renderBooking(booking: Booking) {
    const canCancel =
      booking.status === "CONFIRMED" && isFutureBooking(booking);

    return (
      <article
        key={booking.id}
        className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
                    aria-hidden="true"
                  >
                    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                    <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" />
                  </svg>
                </span>

                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {booking.service.name}
                  </h3>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {formatDate(booking.startsAt)}
                  </p>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                booking.status,
              )}`}
            >
              {statusLabels[booking.status]}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
              <p className="text-xs text-[var(--text-secondary)]">ساعت نوبت</p>

              <p className="mt-1 text-sm font-semibold">
                {formatTime(booking.startsAt)} تا {formatTime(booking.endsAt)}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--bg-card-warm)] p-4">
              <p className="text-xs text-[var(--text-secondary)]">مدت خدمات</p>

              <p className="mt-1 text-sm font-semibold">
                {new Intl.NumberFormat("fa-IR").format(
                  booking.service.duration,
                )}{" "}
                دقیقه
              </p>
            </div>
          </div>

          {canCancel && (
            <div className="mt-5 flex justify-end border-t border-[var(--border-subtle)] pt-5">
              <button
                type="button"
                onClick={() => void handleCancel(booking.id)}
                disabled={cancellingId === booking.id}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancellingId === booking.id ? "در حال لغو..." : "لغو نوبت"}
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-medium text-[var(--brand-crimson)]">
          برنامه شما
        </p>

        <h2 className="mt-1 text-2xl font-bold">نوبت‌های من</h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          نوبت‌های آینده و سوابق خدمات شما در این بخش نمایش داده می‌شود.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {upcomingBookings.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">نوبت‌های آینده</h3>

            <span className="rounded-full bg-[var(--brand-crimson-light)] px-3 py-1 text-xs font-semibold text-[var(--brand-crimson-dark)]">
              {new Intl.NumberFormat("fa-IR").format(upcomingBookings.length)}{" "}
              نوبت
            </span>
          </div>

          <div className="space-y-4">{upcomingBookings.map(renderBooking)}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 fill-none stroke-current stroke-[1.8]"
              aria-hidden="true"
            >
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" />
            </svg>
          </div>

          <p className="mt-4 font-semibold">هنوز نوبت آینده‌ای ندارید</p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            برای رزرو خدمات موردنظرتان می‌توانید از صفحه رزرو نوبت استفاده کنید.
          </p>

          <Link
            href="/#booking"
            className="mt-5 inline-flex rounded-xl bg-[var(--brand-crimson)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
          >
            رزرو نوبت
          </Link>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <h3 className="text-lg font-bold">سوابق نوبت‌ها</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              خدمات قبلی و نوبت‌های لغوشده شما
            </p>
          </div>

          <div className="space-y-4">{pastBookings.map(renderBooking)}</div>
        </div>
      )}
    </section>
  );
}
