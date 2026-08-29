"use client";

import { useState } from "react";
import { CalendarDays, Check, Clock3, Scissors } from "lucide-react";

const services = [
  {
    id: "hair-styling",
    title: "مو و استایل",
    description: "کوتاهی، براشینگ و شینیون",
  },
  {
    id: "hair-color",
    title: "رنگ و لایت",
    description: "رنگ، بالیاژ و هایلایت",
  },
  {
    id: "makeup",
    title: "میکاپ",
    description: "میکاپ مجلسی و تخصصی",
  },
  {
    id: "hair-care",
    title: "مراقبت و احیا",
    description: "احیا و مراقبت تخصصی مو",
  },
];

const dates = [
  { id: "sat-15", day: "شنبه", date: "۱۵ شهریور" },
  { id: "sun-16", day: "یکشنبه", date: "۱۶ شهریور" },
  { id: "mon-17", day: "دوشنبه", date: "۱۷ شهریور" },
  { id: "tue-18", day: "سه‌شنبه", date: "۱۸ شهریور" },
];

const timeSlots = ["۱۰:۰۰", "۱۱:۳۰", "۱۳:۰۰", "۱۵:۳۰", "۱۷:۰۰", "۱۸:۳۰"];

export function Booking() {
  const [selectedService, setSelectedService] = useState("hair-styling");
  const [selectedDate, setSelectedDate] = useState("sat-15");
  const [selectedTime, setSelectedTime] = useState("۱۰:۰۰");

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
            خدمت موردنظر، و زمان مناسب خود را انتخاب کنید و نوبتتان را به‌سادگی
            ثبت کنید.
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
                  {services.map((service) => {
                    const active = selectedService === service.id;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service.id)}
                        className={`relative rounded-xl border p-4 text-right transition-all ${
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
                          {service.title}
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {service.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="my-8 h-px bg-[var(--border-subtle)]" />

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-xs font-bold text-white">
                    ۳
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
                  {dates.map((date) => {
                    const active = selectedDate === date.id;

                    return (
                      <button
                        key={date.id}
                        type="button"
                        onClick={() => setSelectedDate(date.id)}
                        className={`rounded-xl border px-3 py-3 text-center transition-all ${
                          active
                            ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] hover:border-[var(--brand-crimson)]/30"
                        }`}
                      >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {date.day}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                          {date.date}
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

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {timeSlots.map((time) => {
                      const active = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${
                            active
                              ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson)] text-white"
                              : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-primary)] hover:border-[var(--brand-crimson)]/30 hover:text-[var(--brand-crimson)]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
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
                      {
                        services.find(
                          (service) => service.id === selectedService,
                        )?.title
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/50">تاریخ</p>
                    <p className="mt-1 text-sm font-semibold">
                      {dates.find((date) => date.id === selectedDate)?.day}،{" "}
                      {dates.find((date) => date.id === selectedDate)?.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/50">ساعت</p>
                    <p className="mt-1 text-sm font-semibold">{selectedTime}</p>
                  </div>
                </div>

                <div className="mt-auto pt-10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[var(--brand-crimson-dark)] transition-all hover:bg-[var(--bg-cream)]"
                  >
                    <CalendarDays size={17} />
                    ادامه و ثبت نوبت
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-5 text-white/50">
                    پس از ادامه، اطلاعات تماس شما برای تکمیل رزرو دریافت خواهد
                    شد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        {/* <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          زمان‌های نمایش داده‌شده نمونه هستند و در نسخه نهایی بر اساس ظرفیت
          واقعی سالن به‌روزرسانی خواهند شد.
        </p> */}
      </div>
    </section>
  );
}
