"use client";

import {
  CalendarCheck,
  CalendarClock,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminCreateBookingModal } from "@/components/admin/admin-create-booking-modal";
import { ServiceCredits } from "@/components/admin/service-credits";

type OverviewStats = {
  todayBookings: { count: number; changePercent: number | null };
  newUsers: { count: number; changePercent: number | null };
  totalUsers: number;
  aiGenerations: { total: number; conversionRate: number | null };
};

type WeeklyChartEntry = {
  label: string;
  isToday: boolean;
  count: number;
};

type UpcomingBooking = {
  id: string;
  customerName: string;
  serviceName: string;
  startsAt: string;
};

type OverviewResponse = {
  success: boolean;
  message?: string;
  stats: OverviewStats;
  weeklyBookingChart: WeeklyChartEntry[];
  upcomingBookings: UpcomingBooking[];
};

function ChangeIndicator({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
        بدون داده قبلی
      </span>
    );
  }

  const isPositive = percent >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        isPositive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>
        {isPositive ? "+" : ""}
        {Math.abs(percent)}٪
      </span>
    </span>
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OverviewDashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/overview");
      const result = (await response.json()) as OverviewResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "دریافت آمار داشبورد با خطا مواجه شد.",
        );
      }
      setData(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "دریافت آمار داشبورد با خطا مواجه شد.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOverview]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-36 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-800">
        {error || "خطا در دریافت اطلاعات داشبورد."}
      </div>
    );
  }

  const { stats, weeklyBookingChart, upcomingBookings } = data;
  const maxWeeklyCount = Math.max(
    1,
    ...weeklyBookingChart.map((item) => item.count),
  );

  return (
    <div className="space-y-8">
      {/* Real-time credits of third party services (SMS & AI) */}
      <ServiceCredits />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Bookings */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                نوبت‌های امروز
              </span>
              <h3 className="mt-2 text-3xl font-black text-[var(--text-primary)]">
                {stats.todayBookings.count.toLocaleString("fa-IR")}
              </h3>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)] shadow-inner">
              <CalendarCheck size={22} />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
            <ChangeIndicator percent={stats.todayBookings.changePercent} />
            <span>نسبت به روز گذشته</span>
          </div>
        </div>

        {/* Card 2: New Users This Week */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                مشتریان جدید هفته
              </span>
              <h3 className="mt-2 text-3xl font-black text-[var(--text-primary)]">
                {stats.newUsers.count.toLocaleString("fa-IR")}
              </h3>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-inner">
              <UserPlus size={22} />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
            <ChangeIndicator percent={stats.newUsers.changePercent} />
            <span>نسبت به هفته قبل</span>
          </div>
        </div>

        {/* Card 3: Total Registered Clients */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                کل مشتریان ثبت‌شده
              </span>
              <h3 className="mt-2 text-3xl font-black text-[var(--text-primary)]">
                {stats.totalUsers.toLocaleString("fa-IR")}
              </h3>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-inner">
              <Users size={22} />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>بانک مشتریان سالن</span>
          </div>
        </div>

        {/* Card 4: AI Generations */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-[#6c0020] to-[#360010] p-6 text-white shadow-md transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-white/80">
                تصاویر آرایشگر مجازی
              </span>
              <h3 className="mt-2 text-3xl font-black text-white">
                {stats.aiGenerations.total.toLocaleString("fa-IR")}
              </h3>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--accent-gold)] shadow-inner">
              <Sparkles size={22} />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs text-white/70">
            <span>
              {stats.aiGenerations.conversionRate !== null
                ? `${stats.aiGenerations.conversionRate}٪ از تصاویر به نوبت تبدیل شدند`
                : "آمار تبدیل ثبت‌نشده"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Upcoming Bookings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Chart */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                روند نوبت‌های ۷ روز گذشته
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                توزیع روزانه ثبت نوبت‌ها در هفته اخیر
              </p>
            </div>

            <span className="rounded-full bg-[var(--bg-card-warm)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">
              هفته جاری
            </span>
          </div>

          <div className="mt-8 flex h-52 items-end justify-between gap-2 pt-4 sm:gap-4">
            {weeklyBookingChart.map((day, idx) => (
              <div
                key={idx}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                  {day.count.toLocaleString("fa-IR")}
                </span>

                <div className="relative flex h-36 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[42px] rounded-2xl transition-all duration-300 ${
                      day.isToday
                        ? "bg-gradient-to-t from-[var(--brand-crimson)] to-[#b01c44] shadow-md ring-2 ring-[var(--brand-crimson-light)]"
                        : "bg-[var(--bg-card-warm)] hover:bg-[var(--brand-crimson-light)]"
                    }`}
                    style={{
                      height: `${Math.max(10, (day.count / maxWeeklyCount) * 100)}%`,
                    }}
                  />
                </div>

                <span
                  className={`text-xs ${
                    day.isToday
                      ? "font-extrabold text-[var(--brand-crimson)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="flex flex-col justify-between rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[var(--brand-crimson)]">
                  <CalendarClock size={16} />
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  نوبت‌های پیش‌رو امروز
                </h3>
              </div>

              <span className="rounded-full bg-[var(--brand-crimson-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-crimson)]">
                {upcomingBookings.length.toLocaleString("fa-IR")} نوبت
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {upcomingBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
                  برای ساعات باقیمانده امروز، نوبت دیگری ثبت نشده است.
                </div>
              ) : (
                upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-3 transition-colors hover:border-[var(--brand-crimson-light)]"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-[var(--text-primary)]">
                        {booking.customerName}
                      </h4>
                      <p className="truncate text-[11px] text-[var(--text-secondary)]">
                        {booking.serviceName}
                      </p>
                    </div>

                    <div className="shrink-0 text-left">
                      <span className="rounded-lg bg-[var(--bg-card)] px-2 py-1 text-xs font-bold text-[var(--brand-crimson)] shadow-xs">
                        {formatTime(booking.startsAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[var(--brand-crimson)]/20 bg-[var(--brand-crimson-light)] py-2.5 text-xs font-bold text-[var(--brand-crimson)] shadow-xs transition hover:bg-[var(--brand-crimson)] hover:text-white"
          >
            <Plus size={15} />
            <span>ثبت نوبت دستی جدید</span>
          </button>
        </div>
      </div>

      <AdminCreateBookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => void loadOverview()}
      />
    </div>
  );
}
