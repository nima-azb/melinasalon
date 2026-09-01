"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Loader2, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
};

type TimeSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  available: boolean;
};

type AvailabilityResponse = {
  success: boolean;
  date: string;
  timeSlots: TimeSlot[];
  message?: string;
};

type BookingResponse = {
  success: boolean;
  message?: string;
  booking?: {
    id: string;
    status: string;
    service: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
    timeSlot: {
      id: string;
      startsAt: string;
      endsAt: string;
    };
  };
};

function formatPersianDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fa-IR").format(price);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function Booking() {
  const router = useRouter();

  const dates = useMemo(() => {
    const result: Array<{
      id: string;
      value: string;
      label: string;
    }> = [];

    const today = new Date();

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() + index);

      result.push({
        id: getDateKey(date),
        value: getDateKey(date),
        label: formatPersianDate(date),
      });
    }

    return result;
  }, []);

  /*
   * Important:
   * selectedDate is initialized directly from dates.
   *
   * We do NOT use:
   *
   * useEffect(() => {
   *   setSelectedDate(...);
   * }, [dates]);
   *
   * This avoids the React cascading-render lint error.
   */
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return getDateKey(today);
  });

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const selectedServiceData = services.find(
    (service) => service.id === selectedService,
  );

  const selectedTimeSlotData = timeSlots.find(
    (slot) => slot.id === selectedTimeSlot,
  );

  /*
   * Load services from the database.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setLoadingServices(true);
      setError("");

      try {
        const response = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "خطا در دریافت خدمات.");
        }

        const activeServices = (data.services ?? []).filter(
          (service: Service) => service.isActive,
        );

        if (!cancelled) {
          setServices(activeServices);

          if (activeServices.length > 0) {
            setSelectedService(activeServices[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در دریافت خدمات.");
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load availability whenever the selected date changes.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setLoadingAvailability(true);
      setSelectedTimeSlot(null);
      setError("");

      try {
        const response = await fetch(
          `/api/availability?date=${encodeURIComponent(selectedDate)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data: AvailabilityResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "خطا در دریافت زمان‌های خالی.");
        }

        if (!cancelled) {
          setTimeSlots(data.timeSlots ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setTimeSlots([]);
          setError(
            err instanceof Error ? err.message : "خطا در دریافت زمان‌های خالی.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  function handleDateChange(date: string) {
    if (booking) {
      return;
    }

    setSelectedDate(date);
    setBookingSuccess(false);
    setSelectedTimeSlot(null);
  }

  function handleServiceChange(serviceId: string) {
    if (booking) {
      return;
    }

    setSelectedService(serviceId);
    setBookingSuccess(false);
  }

  function handleTimeSlotChange(timeSlotId: string) {
    const slot = timeSlots.find((item) => item.id === timeSlotId);

    if (!slot?.available || booking) {
      return;
    }

    setSelectedTimeSlot(timeSlotId);
    setBookingSuccess(false);
  }

  async function handleBooking() {
    if (!selectedService || !selectedTimeSlot) {
      setError("لطفاً خدمت و زمان موردنظر خود را انتخاب کنید.");
      return;
    }

    setBooking(true);
    setError("");
    setBookingSuccess(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService,
          timeSlotId: selectedTimeSlot,
        }),
      });

      const data: BookingResponse = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ثبت نوبت با خطا مواجه شد.");
      }

      setBookingSuccess(true);

      /*
       * Refresh availability so the just-booked slot becomes unavailable.
       */
      setSelectedTimeSlot(null);

      const availabilityResponse = await fetch(
        `/api/availability?date=${encodeURIComponent(selectedDate)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (availabilityResponse.ok) {
        const availabilityData: AvailabilityResponse =
          await availabilityResponse.json();

        if (availabilityData.success) {
          setTimeSlots(availabilityData.timeSlots ?? []);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ثبت نوبت با خطا مواجه شد.",
      );
    } finally {
      setBooking(false);
    }
  }

  return (
    <section
      id="booking"
      className="bg-[var(--bg-cream)] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium text-[var(--brand-crimson)]">
            <CalendarDays size={14} />
            رزرو آنلاین
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            نوبت خود را
            <span className="text-[var(--brand-crimson)]"> رزرو کنید</span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            خدمت موردنظر، تاریخ و زمان مناسب خود را انتخاب کنید و نوبتتان را
            به‌سادگی ثبت کنید.
          </p>
        </div>

        {/* Booking panel */}
        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_20px_60px_rgba(36,20,23,0.08)]">
          <div className="grid lg:grid-cols-[1fr_0.72fr]">
            {/* Main form */}
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-xs font-bold text-white">
                    ۱
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      انتخاب خدمت
                    </h3>

                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      خدمت موردنظر خود را انتخاب کنید.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {loadingServices ? (
                    <div className="col-span-full flex items-center justify-center py-8 text-sm text-[var(--text-secondary)]">
                      <Loader2 size={18} className="ml-2 animate-spin" />
                      در حال دریافت خدمات...
                    </div>
                  ) : services.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-5 text-center text-sm text-[var(--text-secondary)]">
                      در حال حاضر خدمتی برای رزرو وجود ندارد.
                    </div>
                  ) : (
                    services.map((service) => {
                      const active = selectedService === service.id;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleServiceChange(service.id)}
                          disabled={booking}
                          className={`relative rounded-xl border p-4 text-right transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            active
                              ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)]"
                              : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] hover:border-[var(--brand-crimson)]/30"
                          }`}
                        >
                          {active && (
                            <span className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-white">
                              <Check size={12} />
                            </span>
                          )}

                          <Scissors
                            size={18}
                            className="text-[var(--brand-crimson)]"
                          />

                          <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                            {service.name}
                          </p>

                          {service.description && (
                            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                              {service.description}
                            </p>
                          )}

                          <p className="mt-3 text-xs text-[var(--text-secondary)]">
                            {service.duration} دقیقه
                            {" · "}
                            {formatPrice(service.price)} تومان
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="my-8 h-px bg-[var(--border-subtle)]" />

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-xs font-bold text-white">
                    ۲
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      انتخاب تاریخ و زمان
                    </h3>

                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      یکی از زمان‌های موجود را انتخاب کنید.
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {dates.slice(0, 4).map((date) => {
                    const active = selectedDate === date.value;

                    return (
                      <button
                        key={date.id}
                        type="button"
                        onClick={() => handleDateChange(date.value)}
                        disabled={booking}
                        className={`rounded-xl border px-3 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] hover:border-[var(--brand-crimson)]/30"
                        }`}
                      >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {date.label.split("،")[0]}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                          {date.label.split("،").slice(1).join("،")}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Times */}
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                    <Clock3 size={14} />
                    ساعت‌های موجود
                  </div>

                  {loadingAvailability ? (
                    <div className="flex items-center justify-center py-8 text-sm text-[var(--text-secondary)]">
                      <Loader2 size={18} className="ml-2 animate-spin" />
                      در حال دریافت زمان‌های خالی...
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-5 text-center text-sm text-[var(--text-secondary)]">
                      برای این تاریخ زمانی برای رزرو وجود ندارد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {timeSlots.map((slot) => {
                        const active = selectedTimeSlot === slot.id;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available || booking}
                            onClick={() => handleTimeSlotChange(slot.id)}
                            className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${
                              !slot.available
                                ? "cursor-not-allowed border-[var(--border-subtle)] bg-gray-100 text-gray-400 line-through"
                                : active
                                  ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson)] text-white"
                                  : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-primary)] hover:border-[var(--brand-crimson)]/30 hover:text-[var(--brand-crimson)]"
                            }`}
                          >
                            {formatTime(slot.startsAt)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {bookingSuccess && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
                  نوبت شما با موفقیت ثبت شد. اطلاعات نوبت از طریق پیامک برای
                  شماره موبایل شما ارسال خواهد شد.
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-[var(--brand-crimson-dark)] p-6 text-white sm:p-8 lg:p-10">
              <div className="flex h-full flex-col">
                <p className="text-xs font-medium text-white/60">خلاصه نوبت</p>

                <h3 className="mt-2 text-2xl font-bold">آماده ثبت نوبت شما</h3>

                <div className="my-8 h-px bg-white/10" />

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] text-white/50">خدمت</p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedServiceData?.name ?? "انتخاب نشده"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/50">تاریخ</p>

                    <p className="mt-1 text-sm font-semibold">
                      {dates.find((date) => date.value === selectedDate)?.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/50">ساعت</p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedTimeSlotData
                        ? formatTime(selectedTimeSlotData.startsAt)
                        : "انتخاب نشده"}
                    </p>
                  </div>

                  {selectedServiceData && (
                    <div>
                      <p className="text-[10px] text-white/50">مبلغ</p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatPrice(selectedServiceData.price)} تومان
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-10">
                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={
                      booking ||
                      loadingServices ||
                      loadingAvailability ||
                      !selectedService ||
                      !selectedTimeSlot
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[var(--brand-crimson-dark)] transition-all hover:bg-[var(--bg-cream)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {booking ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        در حال ثبت نوبت...
                      </>
                    ) : (
                      <>
                        <CalendarDays size={17} />
                        ثبت نوبت
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-5 text-white/50">
                    پس از ثبت نوبت، اطلاعات رزرو برای شماره موبایل شما پیامک
                    خواهد شد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
