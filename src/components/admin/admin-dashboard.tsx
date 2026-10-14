"use client";

import {
  CalendarDays,
  CalendarX2,
  Clock,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Scissors,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BlockedTimeManagement } from "@/components/admin/blocked-time-management";
import { BookingManagement } from "@/components/admin/booking-management";
import { GenerationManagement } from "@/components/admin/generation-management";
import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { ServiceManagement } from "@/components/admin/service-management";
import { UsersManagement } from "@/components/admin/users-management";
import { LogoutButton } from "@/components/auth/logout-button";

type AdminTab = "dashboard" | "bookings" | "services" | "users" | "generations";
type BookingSubTab = "list" | "blocked";

const tabs: Array<{
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "bookings", label: "نوبت‌ها و زمان‌بندی", icon: CalendarDays },
  { id: "services", label: "خدمات سالن", icon: Scissors },
  { id: "users", label: "کاربران و مشتریان", icon: Users },
  { id: "generations", label: "هوش مصنوعی آرایشگر", icon: Sparkles },
];

const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "داشبورد مدیریت سالن",
    subtitle: "مرور آمارهای کلیدی، نوبت‌های پیش‌رو و اعتبار سرویس‌ها",
  },
  bookings: {
    title: "مدیریت نوبت‌ها و زمان‌بندی",
    subtitle: "بررسی وضعیت رزروها، تایید، لغو و تعیین ساعات مسدود",
  },
  services: {
    title: "مدیریت خدمات سالن",
    subtitle: "تنظیم، ویرایش، تعیین مدت زمان و فعال‌سازی خدمات",
  },
  users: {
    title: "بانک مشتریان و کاربران",
    subtitle: "فهرست مراجعین سالن با سوابق رزرو و اطلاعات تماس",
  },
  generations: {
    title: "آرشیو تصاویر هوش مصنوعی",
    subtitle: "بررسی مدل‌ها و تصاویری که کاربران با هوش مصنوعی ساخته‌اند",
  },
};

export function AdminDashboard({ adminName }: { adminName: string | null }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [bookingSubTab, setBookingSubTab] = useState<BookingSubTab>("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);
      setCurrentDateTime(formatted);
    }

    updateClock();
    const interval = setInterval(updateClock, 30_000);
    return () => clearInterval(interval);
  }, []);

  function selectTab(tab: AdminTab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  const initialLetter = adminName?.trim() ? adminName.trim().charAt(0) : "م";

  return (
    <div className="min-h-screen bg-[var(--bg-cream)] text-[var(--text-primary)]">
      <div className="relative mx-auto flex max-w-[1680px]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-lg transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 left-4 rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-warm)] hover:text-[var(--brand-crimson)] lg:hidden"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>

          {/* Logo & Brand Monogram */}
          <div className="flex items-center gap-3.5 border-b border-[var(--border-subtle)] pb-5 pt-2 lg:pt-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-crimson)] to-[#4a0015] text-white shadow-md">
              <span className="font-serif text-xl font-black">M</span>
            </div>
            <div className="min-w-0">
              <Link
                href="/"
                className="block truncate text-base font-extrabold text-[var(--brand-crimson)] transition-colors hover:opacity-90"
              >
                ملین بیوتی
              </Link>
              <span className="block truncate text-xs font-medium text-[var(--text-secondary)]">
                پنل مدیریت و نوبت‌دهی
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
            <div className="mb-2 px-3 text-[11px] font-semibold text-[var(--text-secondary)]">
              بخش‌های اصلی پنل
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-white" : "text-[var(--brand-crimson)]"
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>

                  {isActive && (
                    <span className="mr-auto h-2 w-2 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Card & Footer Actions */}
          <div className="mt-auto border-t border-[var(--border-subtle)] pt-4 space-y-3">
            {/* Admin identity pill */}
            <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card-warm)] p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-crimson-light)] font-bold text-[var(--brand-crimson)]">
                {initialLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                  {adminName || "مدیر سالن"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>دسترسی مدیر کل</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)]"
              >
                <span>مشاهده سایت</span>
                <ExternalLink size={12} />
              </Link>

              <LogoutButton className="shrink-0" redirectTo="/admin/login" />
            </div>
          </div>
        </aside>

        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="min-h-screen flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Mobile top bar */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-sm lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-crimson)] text-white">
                <span className="font-serif font-black">M</span>
              </div>
              <h1 className="text-base font-bold text-[var(--text-primary)]">
                {tabTitles[activeTab].title}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl bg-[var(--bg-card-warm)] p-2 text-[var(--brand-crimson)] transition hover:bg-[var(--brand-crimson-light)]"
              aria-label="باز کردن منو"
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Desktop Top Header Bar */}
          <header className="mb-8 hidden items-center justify-between rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm lg:flex">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                {tabTitles[activeTab].title}
              </h1>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                {tabTitles[activeTab].subtitle}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {currentDateTime && (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-card-warm)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)]">
                  <Clock size={14} className="text-[var(--brand-crimson)]" />
                  <span>{currentDateTime}</span>
                </div>
              )}

              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-crimson-light)] px-4 py-2 text-xs font-bold text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson)] hover:text-white"
              >
                <span>مشاهده سایت اصلی</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </header>

          {/* Tab 1: Dashboard Overview */}
          {activeTab === "dashboard" && <OverviewDashboard />}

          {/* Tab 2: Bookings & Schedule with Segmented Sub-tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              {/* Sleek Sub-tab Switcher */}
              <div className="flex w-fit items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBookingSubTab("list")}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                    bookingSubTab === "list"
                      ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-warm)]"
                  }`}
                >
                  <CalendarDays size={16} />
                  <span>نوبت‌های مشتریان سالن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingSubTab("blocked")}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                    bookingSubTab === "blocked"
                      ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-warm)]"
                  }`}
                >
                  <CalendarX2 size={16} />
                  <span>زمان‌های مسدود و تعطیلی سالن</span>
                </button>
              </div>

              {bookingSubTab === "list" ? (
                <BookingManagement />
              ) : (
                <BlockedTimeManagement />
              )}
            </div>
          )}

          {/* Tab 3: Services Management */}
          {activeTab === "services" && <ServiceManagement />}

          {/* Tab 4: Users Management */}
          {activeTab === "users" && <UsersManagement />}

          {/* Tab 5: AI Hairdresser Generations */}
          {activeTab === "generations" && <GenerationManagement />}
        </main>
      </div>
    </div>
  );
}
