"use client";

import {
  CalendarCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      <span className="text-xs text-[var(--text-secondary)]">
        بدون داده مقایسه
      </span>
    );
  }

  const isPositive = percent >= 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {isPositive ? "+" : ""}
      {percent}٪
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

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/overview");
        const result = (await response.json()) as OverviewResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "دریافت آمار داشبورد با خطا مواجه شد.",
          );
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت آمار داشبورد با خطا مواجه شد.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-[var(--bg-card)]"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
        {error || "دریافت آمار داشبورد با خطا مواجه شد."}
      </div>
    );
  }

  const { stats, weeklyBookingChart, upcomingBookings } = data;
  const maxWeeklyCount = Math.max(1, ...weeklyBookingChart.map((d) => d.count));

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                رزروهای امروز
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {stats.todayBookings.count}
              </h3>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <CalendarCheck size={20} />
            </span>
          </div>

          <div className="mt-3">
            <ChangeIndicator percent={stats.todayBookings.changePercent} />
            <span className="mr-1 text-xs text-[var(--text-secondary)]">
              نسبت به دیروز
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                کاربران جدید این هفته
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {stats.newUsers.count}
              </h3>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <UserPlus size={20} />
            </span>
          </div>

          <div className="mt-3">
            <ChangeIndicator percent={stats.newUsers.changePercent} />
            <span className="mr-1 text-xs text-[var(--text-secondary)]">
              نسبت به هفته قبل
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                کل کاربران سالن
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {stats.totalUsers}
              </h3>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <Users size={20} />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[var(--brand-crimson)] p-6 text-white shadow-[0_8px_30px_rgba(108,0,32,0.15)]">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/70">
                تست‌های موفق هوش مصنوعی
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                {stats.aiGenerations.total}
              </h3>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Sparkles size={20} />
            </span>
          </div>

          <div className="relative mt-3 text-xs text-white/80">
            {stats.aiGenerations.conversionRate === null
              ? "هنوز داده‌ای برای نرخ تبدیل وجود ندارد"
              : `نرخ کاربران با نوبت تایید‌شده: ${stats.aiGenerations.conversionRate}٪`}
          </div>
        </div>
      </div>

      {/* Chart + upcoming list */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Weekly chart */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm xl:col-span-2">
          <h3 className="font-bold text-[var(--text-primary)]">
            آمار رزرو هفتگی
          </h3>

          <div className="mt-8 flex h-56 items-end justify-between gap-2 sm:gap-4">
            {weeklyBookingChart.map((day) => (
              <div
                key={day.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {day.count}
                </span>

                <div className="flex h-40 w-full items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      day.isToday
                        ? "bg-[var(--brand-crimson)] shadow-[0_0_15px_rgba(108,0,32,0.25)]"
                        : "bg-[var(--brand-crimson-light)]"
                    }`}
                    style={{
                      height: `${Math.max(6, (day.count / maxWeeklyCount) * 100)}%`,
                    }}
                  />
                </div>

                <span
                  className={`text-xs ${
                    day.isToday
                      ? "font-bold text-[var(--brand-crimson)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
          <h3 className="font-bold text-[var(--text-primary)]">
            نوبت‌های پیش رو
          </h3>

          <div className="mt-4 flex-1 space-y-3">
            {upcomingBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
                نوبت دیگری برای امروز باقی نمانده است.
              </p>
            ) : (
              upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-[var(--border-subtle)] hover:bg-[var(--bg-card-warm)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                    <CalendarCheck size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {booking.customerName}
                    </h4>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {booking.serviceName}
                    </p>
                  </div>

                  <div className="shrink-0 text-left">
                    <span className="block text-sm font-medium text-[var(--text-primary)]">
                      {formatTime(booking.startsAt)}
                    </span>
                    <span className="mt-1 inline-block rounded-full bg-[var(--brand-crimson-light)] px-2 py-0.5 text-[10px] text-[var(--brand-crimson)]">
                      امروز
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/#booking"
            className="mt-4 flex w-full items-center justify-center rounded-xl border border-[var(--border-beige)] py-3 text-sm font-medium text-[var(--brand-crimson)] transition-colors hover:bg-[var(--bg-card-warm)]"
          >
            + ثبت نوبت جدید
          </Link>
        </div>
      </div>
    </div>
  );
}
