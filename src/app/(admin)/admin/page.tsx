"use client";

import { useState } from "react";

import { BookingManagement } from "@/components/admin/booking-management";
import { GenerationManagement } from "@/components/admin/generation-management";
import { ServiceManagement } from "@/components/admin/service-management";
import { BlockedTimeManagement } from "@/components/admin/blocked-time-management";

type AdminTab = "services" | "bookings" | "generations";

const tabs: Array<{
  id: AdminTab;
  label: string;
}> = [
  {
    id: "services",
    label: "خدمات",
  },
  {
    id: "bookings",
    label: "نوبت‌ها",
  },
  {
    id: "generations",
    label: "تصاویر هوش مصنوعی",
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("services");

  return (
    <main className="min-h-screen bg-[var(--bg-cream)] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            پنل مدیریت
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            مدیریت خدمات، نوبت‌ها و تصاویر هوش مصنوعی
          </p>
        </header>

        <nav
          className="mt-8 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 shadow-[0_20px_60px_rgba(36,20,23,0.06)]"
          aria-label="بخش‌های پنل مدیریت"
        >
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[var(--brand-crimson)] text-white shadow-md shadow-[var(--brand-crimson)]/15"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)] hover:text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-8">
          {activeTab === "services" && <ServiceManagement />}

          {activeTab === "bookings" && (
            <div className="space-y-8">
              <BookingManagement />
              <BlockedTimeManagement />
            </div>
          )}

          {activeTab === "generations" && <GenerationManagement />}
        </div>
      </div>
    </main>
  );
}
