"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Scissors,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BlockedTimeManagement } from "@/components/admin/blocked-time-management";
import { BookingManagement } from "@/components/admin/booking-management";
import { GenerationManagement } from "@/components/admin/generation-management";
import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { ServiceManagement } from "@/components/admin/service-management";
import { UsersManagement } from "@/components/admin/users-management";
import { LogoutButton } from "@/components/auth/logout-button";

type AdminTab = "dashboard" | "bookings" | "services" | "users" | "generations";

const tabs: Array<{
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "bookings", label: "نوبت‌ها", icon: CalendarDays },
  { id: "services", label: "خدمات", icon: Scissors },
  { id: "users", label: "کاربران", icon: Users },
  { id: "generations", label: "نتایج هوش مصنوعی", icon: Sparkles },
];

const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "داشبورد مدیریت",
    subtitle: "مروری بر فعالیت‌های امروز سالن",
  },
  bookings: {
    title: "مدیریت نوبت‌ها",
    subtitle: "بررسی، تایید و مدیریت نوبت‌های مشتریان",
  },
  services: {
    title: "مدیریت خدمات",
    subtitle: "افزودن، ویرایش و فعال‌سازی خدمات سالن",
  },
  users: {
    title: "کاربران سالن",
    subtitle: "لیست مشتریانی که در سالن ثبت‌نام کرده‌اند",
  },
  generations: {
    title: "نتایج هوش مصنوعی",
    subtitle: "بررسی تصاویر ساخته‌شده توسط آرایشگر هوش مصنوعی",
  },
};

export function AdminDashboard({ adminName }: { adminName: string | null }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function selectTab(tab: AdminTab) {
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-cream)]">
      <div className="relative mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 flex w-64 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 left-4 text-[var(--text-secondary)] hover:text-[var(--brand-crimson)] lg:hidden"
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>

          <div className="pt-4 lg:pt-0">
            <Link
              href="/"
              className="text-lg font-bold text-[var(--brand-crimson)]"
            >
              پنل مدیریت
            </Link>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              سالن زیبایی ملینا
            </p>
          </div>

          <nav className="mt-8 flex-1 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-card-warm)]"
                  }`}
                >
                  <Icon size={19} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-6">
            <Link
              href="/"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-warm)] hover:text-[var(--brand-crimson)]"
            >
              ← بازگشت به سایت
            </Link>

            <LogoutButton className="w-full" />
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1 p-4 sm:p-6 lg:p-10">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-sm lg:hidden">
            <h1 className="truncate text-lg font-bold text-[var(--text-primary)]">
              {tabTitles[activeTab].title}
            </h1>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg bg-[var(--bg-card-warm)] p-2 text-[var(--brand-crimson)]"
              aria-label="باز کردن منو"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Desktop header */}
          <header className="mb-6 hidden items-baseline justify-between lg:flex">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {tabTitles[activeTab].title}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {adminName ? `خوش آمدید، ${adminName}. ` : ""}
                {tabTitles[activeTab].subtitle}
              </p>
            </div>
          </header>

          {activeTab === "dashboard" && <OverviewDashboard />}

          {activeTab === "bookings" && (
            <div className="space-y-8">
              <BookingManagement />
              <BlockedTimeManagement />
            </div>
          )}

          {activeTab === "services" && <ServiceManagement />}

          {activeTab === "users" && <UsersManagement />}

          {activeTab === "generations" && <GenerationManagement />}
        </main>
      </div>
    </div>
  );
}
