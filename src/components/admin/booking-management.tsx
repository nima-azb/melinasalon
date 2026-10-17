"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  History,
  Phone,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminCreateBookingModal } from "./admin-create-booking-modal";
import { JalaliDatePicker } from "../ui/jalali-date-picker";

type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Service = {
  id: string;
  name: string;
};

type PaymentInfo = {
  amount: number;
  status: string;
  refId: string | null;
};

type Booking = {
  id: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  packageName?: string | null;
  price?: number | null;
  user: {
    id: string;
    phoneNumber: string;
    fullName?: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price?: number | null;
  };
  payment?: PaymentInfo | null;
};

type BookingsResponse = {
  success: boolean;
  bookings?: Booking[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
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
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
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
  const [includePast, setIncludePast] = useState(false);

  const [sort, setSort] = useState<SortField>("appointment");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

      if (includePast) {
        params.set("includePast", "true");
      }

      params.set("sort", sort);
      params.set("direction", direction);
      params.set("page", String(page));
      params.set("limit", "12");

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });

      const data: BookingsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در دریافت نوبت‌ها.");
      }

      setBookings(data.bookings ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? (data.bookings?.length || 0));
      setError(null);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت نوبت‌ها.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    fromDate,
    toDate,
    status,
    serviceId,
    includePast,
    sort,
    direction,
    page,
  ]);

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
          throw new Error(data.message || "خطا در دریافت خدمات.");
        }

        if (!cancelled) {
          setServices(data.services ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load services:", err);
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در به‌روزرسانی نوبت.");
      }

      await loadBookings();
    } catch (err) {
      console.error("Failed to update booking status:", err);
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت نوبت.");
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
    setIncludePast(false);
    setSort("appointment");
    setDirection("asc");
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(status) ||
    Boolean(serviceId) ||
    includePast;

  return (
    <section className="space-y-6">
      {/* Search & Status Filter Header */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm space-y-4">
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="جستجوی نام یا شماره تماس مشتری..."
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-2.5 pr-10 pl-4 text-xs font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle past dates */}
            <button
              type="button"
              onClick={() => {
                setIncludePast(!includePast);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition ${
                includePast
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)]"
              }`}
              title="تغییر محدوده زمانی نوبت‌ها"
            >
              <History
                size={14}
                className={includePast ? "text-amber-600" : ""}
              />
              <span>{includePast ? "شامل سوابق گذشته" : "امروز به بعد"}</span>
            </button>

            {/* Advanced filters toggle button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                showAdvancedFilters || hasActiveFilters
                  ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)]"
              }`}
            >
              <Filter size={14} />
              <span>فیلترهای بیشتر</span>
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-crimson)]" />
              )}
            </button>

            {/* Create manual booking button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-[var(--brand-crimson)] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--brand-crimson-hover)]"
              title="ثبت نوبت دستی توسط مدیر"
            >
              <Plus size={14} />
              <span>ثبت نوبت دستی</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
          <span className="ml-1 text-xs font-semibold text-[var(--text-secondary)]">
            وضعیت:
          </span>

          {[
            { id: "", label: "همه" },
            { id: "CONFIRMED", label: "تأیید شده" },
            { id: "COMPLETED", label: "تکمیل شده" },
            { id: "CANCELLED", label: "لغو شده" },
          ].map((chip) => {
            const isSelected = status === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setStatus(chip.id as BookingStatus | "");
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[var(--brand-crimson)] text-white shadow-xs"
                    : "bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mr-auto text-xs font-bold text-rose-600 transition hover:underline"
            >
              پاک کردن همه فیلترها
            </button>
          )}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                از تاریخ نوبت
              </label>
              <JalaliDatePicker
                value={fromDate}
                onChange={(date) => {
                  setFromDate(date);
                  setPage(1);
                }}
                placeholder="انتخاب تاریخ شروع"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                تا تاریخ نوبت
              </label>
              <JalaliDatePicker
                value={toDate}
                onChange={(date) => {
                  setToDate(date);
                  setPage(1);
                }}
                placeholder="انتخاب تاریخ پایان"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                انتخاب خدمت
              </label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setPage(1);
                }}
                disabled={loadingServices}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
              >
                <option value="">همه خدمات</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                مرتب‌سازی
              </label>
              <select
                value={`${sort}-${direction}`}
                onChange={(e) => {
                  const [newSort, newDir] = e.target.value.split("-") as [
                    SortField,
                    SortDirection,
                  ];
                  setSort(newSort);
                  setDirection(newDir);
                }}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
              >
                <option value="appointment-asc">تاریخ نوبت (نزدیک‌ترین)</option>
                <option value="appointment-desc">تاریخ نوبت (دورترین)</option>
                <option value="createdAt-desc">تاریخ ثبت (جدیدترین)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {/* Bookings Count Summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-[var(--text-secondary)]">
          تعداد کل نوبت‌ها:{" "}
          <strong className="text-[var(--text-primary)]">
            {totalCount.toLocaleString("fa-IR")}
          </strong>
          {!includePast && !fromDate && (
            <span className="mr-2 text-[11px] font-normal text-[var(--text-secondary)]">
              (از امروز به بعد)
            </span>
          )}
        </span>

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <RefreshCw
              size={13}
              className="animate-spin text-[var(--brand-crimson)]"
            />
            <span>در حال به‌روزرسانی...</span>
          </div>
        )}
      </div>

      {/* Bookings Cards List */}
      {loading && bookings.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
          <Calendar
            size={36}
            className="mx-auto text-[var(--text-secondary)] opacity-50"
          />
          <h4 className="mt-3 text-sm font-bold text-[var(--text-primary)]">
            نوبتی یافت نشد
          </h4>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            با فیلترهای انتخاب‌شده نوبتی ثبت نشده است.
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
              <span>جستجو در سوابق گذشته</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {bookings.map((booking) => {
            const isUpdating = updatingBookingId === booking.id;
            const clientName = booking.user.fullName || "مشتری مهمان";
            const clientInitial = clientName.charAt(0);

            return (
              <div
                key={booking.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-xs transition-all hover:border-[var(--brand-crimson-light)] hover:shadow-md lg:flex-row lg:items-center"
              >
                {/* Client Info & Service */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] text-base font-extrabold text-[var(--brand-crimson)]">
                    {clientInitial}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4 className="truncate text-sm font-black text-[var(--text-primary)]">
                        {clientName}
                      </h4>
                      <a
                        href={`tel:${booking.user.phoneNumber}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand-crimson)]"
                        title="تماس تلفنی"
                      >
                        <Phone size={11} />
                        <span dir="ltr">{booking.user.phoneNumber}</span>
                      </a>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[var(--brand-crimson-light)] px-2.5 py-1 text-xs font-bold text-[var(--brand-crimson)]">
                        {booking.service.name}
                      </span>
                      {booking.packageName && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                          پکیج {booking.packageName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)]">
                        <Clock size={12} />
                        {booking.service.duration.toLocaleString("fa-IR")} دقیقه
                      </span>
                      {booking.price !== null && booking.price !== undefined ? (
                        <span className="rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-crimson)]">
                          {booking.price.toLocaleString("fa-IR")} تومان
                        </span>
                      ) : booking.service.price !== null &&
                        booking.service.price !== undefined ? (
                        <span className="rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-crimson)]">
                          {booking.service.price.toLocaleString("fa-IR")} تومان
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Appointment Date, Time & Payment */}
                <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <Calendar
                      size={13}
                      className="text-[var(--brand-crimson)]"
                    />
                    <span>{formatDate(booking.startsAt)}</span>
                    <span className="rounded-md bg-[var(--bg-card-warm)] px-2 py-0.5 text-[var(--brand-crimson)]">
                      {formatTime(booking.startsAt)} تا{" "}
                      {formatTime(booking.endsAt)}
                    </span>
                  </div>

                  {/* Payment deposit status */}
                  {booking.payment && booking.payment.status === "PAID" ? (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span>
                        بیعانه آنلاین:{" "}
                        {booking.payment.amount.toLocaleString("fa-IR")} تومان
                      </span>
                      {booking.payment.refId && (
                        <span className="text-[10px] text-emerald-800/80">
                          (کد: {booking.payment.refId})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200">
                      پرداخت حضوری در سالن
                    </span>
                  )}
                </div>

                {/* Status Badge & Action Buttons */}
                <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3 lg:border-none lg:pt-0">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[booking.status]}`}
                  >
                    {statusLabels[booking.status]}
                  </span>

                  {/* Actions for confirmed bookings */}
                  {booking.status === "CONFIRMED" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingStatus(booking.id, "COMPLETED")
                        }
                        disabled={isUpdating}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        title="ثبت به عنوان انجام‌شده"
                      >
                        <CheckCircle size={13} />
                        <span>تکمیل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateBookingStatus(booking.id, "CANCELLED")
                        }
                        disabled={isUpdating}
                        className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        title="لغو این نوبت"
                      >
                        <XCircle size={13} />
                        <span>لغو</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
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
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
          >
            صفحه بعد →
          </button>
        </div>
      )}

      <AdminCreateBookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => void loadBookings()}
      />
    </section>
  );
}
