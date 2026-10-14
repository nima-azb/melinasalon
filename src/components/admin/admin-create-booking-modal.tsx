"use client";

import {
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Scissors,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { JalaliDatePicker } from "../ui/jalali-date-picker";

type Service = {
  id: string;
  name: string;
  duration: number;
  isActive: boolean;
};

type AvailabilityTimeSlot = {
  startsAt: string;
  endsAt: string;
  available: boolean;
};

type AvailabilityResponse = {
  success: boolean;
  timeSlots: AvailabilityTimeSlot[];
  message?: string;
};

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type AdminCreateBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AdminCreateBookingModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateBookingModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [selectedStartsAt, setSelectedStartsAt] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<AvailabilityTimeSlot[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /*
   * دریافت خدمات فعال
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadServices() {
      try {
        setLoadingServices(true);
        const res = await fetch("/api/services", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled && data.success) {
          const activeServices = (data.services ?? []).filter(
            (s: Service) => s.isActive,
          );
          setServices(activeServices);
          if (activeServices.length > 0 && !serviceId) {
            setServiceId(activeServices[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load services for admin modal:", err);
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
  }, [isOpen, serviceId]);

  /*
   * دریافت زمان‌های در دسترس با تغییر تاریخ یا سرویس
   */
  useEffect(() => {
    if (!isOpen || !serviceId || !selectedDate) {
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingSlots(true);
        setSelectedStartsAt(null);
        setError(null);

        const params = new URLSearchParams();
        params.set("date", selectedDate);
        params.set("serviceId", serviceId);

        const res = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const data: AvailabilityResponse = await res.json();

        if (!cancelled) {
          if (res.ok && data.success) {
            setTimeSlots(data.timeSlots ?? []);
          } else {
            setTimeSlots([]);
            setError(data.message || "خطا در دریافت زمان‌های در دسترس.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setTimeSlots([]);
          setError(
            err instanceof Error ? err.message : "خطا در دریافت زمان‌ها.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [isOpen, serviceId, selectedDate]);

  function resetForm() {
    setClientName("");
    setClientPhone("");
    setSelectedStartsAt(null);
    setError(null);
    setSuccessMessage(null);
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clientName.trim()) {
      setError("لطفاً نام و نام خانوادگی مشتری را وارد کنید.");
      return;
    }

    if (!clientPhone.trim()) {
      setError("لطفاً شماره تلفن مشتری را وارد کنید.");
      return;
    }

    if (!serviceId) {
      setError("لطفاً خدمت مورد نظر را انتخاب کنید.");
      return;
    }

    if (!selectedStartsAt) {
      setError("لطفاً یکی از ساعت‌های خالی را انتخاب کنید.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          serviceId,
          startsAt: selectedStartsAt,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "ثبت نوبت با خطا مواجه شد.");
      }

      setSuccessMessage(
        data.message ||
          "نوبت با موفقیت ثبت شد و پیامک تأیید برای مشتری ارسال گردید.",
      );

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت نوبت.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const selectedServiceObj = services.find((s) => s.id === serviceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <CalendarDays size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                ثبت نوبت دستی توسط مدیر
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                ثبت نوبت برای مشتری (بدون نیاز به ثبت‌نام قبلی) و ارسال پیامک
                تأیید
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
            <Check size={18} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Client Name & Phone */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <User size={13} className="text-[var(--brand-crimson)]" />
                <span>نام و نام خانوادگی مشتری *</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                disabled={submitting}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                شماره موبایل مشتری *
              </label>
              <input
                type="tel"
                dir="ltr"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="09123456789"
                disabled={submitting}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-left text-xs font-bold text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
              />
            </div>
          </div>

          {/* Service & Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Scissors size={13} className="text-[var(--brand-crimson)]" />
                <span>انتخاب خدمت *</span>
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={loadingServices || submitting}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} دقیقه)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                تاریخ نوبت *
              </label>
              <JalaliDatePicker
                value={selectedDate}
                onChange={(dateStr) => {
                  if (dateStr) {
                    setSelectedDate(dateStr);
                  }
                }}
                placeholder="انتخاب تاریخ نوبت"
              />
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Clock3 size={13} className="text-[var(--brand-crimson)]" />
                <span>ساعت‌های خالی قابل رزرو *</span>
              </label>

              {selectedServiceObj && (
                <span className="text-[11px] text-[var(--text-secondary)]">
                  مدت زمان خدمت: {selectedServiceObj.duration} دقیقه
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-6 text-xs text-[var(--text-secondary)]">
                <Loader2
                  size={16}
                  className="ml-2 animate-spin text-[var(--brand-crimson)]"
                />
                در حال دریافت زمان‌های آزاد...
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4 text-center text-xs text-[var(--text-secondary)]">
                برای این تاریخ و خدمت، هیچ ساعت آزادی وجود ندارد یا ظرفیت تکمیل
                شده است.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 max-h-40 overflow-y-auto p-1">
                {timeSlots.map((slot) => {
                  const active = selectedStartsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      disabled={!slot.available || submitting}
                      onClick={() => setSelectedStartsAt(slot.startsAt)}
                      className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                        !slot.available
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through opacity-50"
                          : active
                            ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson)] text-white shadow-xs"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-primary)] hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)]"
                      }`}
                    >
                      {formatTime(slot.startsAt)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={
                submitting || !selectedStartsAt || !clientName || !clientPhone
              }
              className="flex items-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>در حال ثبت نوبت و ارسال پیامک...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>ثبت نوبت و ارسال پیامک</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
