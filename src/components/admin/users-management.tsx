"use client";

import {
  CalendarDays,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: {
    bookings: number;
    generations: number;
  };
};

type UsersApiResponse = {
  success: boolean;
  message?: string;
  users?: AdminUser[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (roleFilter !== "ALL") {
        params.set("role", roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });

      const data = (await response.json()) as UsersApiResponse;

      if (!response.ok || !data.success || !data.users) {
        throw new Error(data.message || "خطا در دریافت کاربران.");
      }

      setUsers(data.users);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? data.users.length);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "خطا در دریافت کاربران.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
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
            placeholder="جستجوی نام یا شماره تلفن مشتری..."
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-2.5 pr-10 pl-4 text-xs font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "همه مراجعین" },
            { id: "USER", label: "مشتریان" },
            { id: "ADMIN", label: "مدیران سالن" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRoleFilter(item.id as typeof roleFilter);
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                roleFilter === item.id
                  ? "bg-[var(--brand-crimson)] text-white shadow-xs"
                  : "bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-6">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">
                بانک مشتریان سالن
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                لیست افرادی که در سیستم ثبت‌نام کرده یا نوبت رزرو کرده‌اند
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isLoading && (
                <RefreshCw
                  size={14}
                  className="animate-spin text-[var(--brand-crimson)]"
                />
              )}
              <span className="rounded-full bg-[var(--bg-card-warm)] px-3 py-1 text-xs font-bold text-[var(--brand-crimson)]">
                {totalCount.toLocaleString("fa-IR")} مشتری
              </span>
            </div>
          </div>

          {isLoading && users.length === 0 ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-[var(--bg-card-warm)]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-xs font-bold text-rose-700">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users
                size={32}
                className="mx-auto text-[var(--text-secondary)] opacity-40"
              />
              <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">
                کاربری با این مشخصات یافت نشد.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-secondary)]">
                    <th className="px-6 py-3.5 font-bold">
                      نام و اطلاعات مشتری
                    </th>
                    <th className="px-6 py-3.5 font-bold">شماره تماس</th>
                    <th className="px-6 py-3.5 font-bold">تاریخ عضویت</th>
                    <th className="px-6 py-3.5 font-bold">تعداد نوبت‌ها</th>
                    <th className="px-6 py-3.5 font-bold">تست‌های AI</th>
                    <th className="px-6 py-3.5 font-bold">نقش کاربری</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {users.map((user) => {
                    const clientName = user.fullName || "مشتری مهمان";
                    const clientInitial = clientName.charAt(0);

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-[var(--bg-card-warm)]/60"
                      >
                        {/* Name & Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] font-black text-[var(--brand-crimson)] shadow-xs">
                              {clientInitial}
                            </div>
                            <div>
                              <span className="block font-bold text-[var(--text-primary)]">
                                {clientName}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                شناسه: {user.id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone with call link */}
                        <td className="px-6 py-4">
                          <a
                            href={`tel:${user.phoneNumber}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-card-warm)] px-2.5 py-1 font-semibold text-[var(--text-primary)] transition hover:text-[var(--brand-crimson)]"
                          >
                            <Phone
                              size={12}
                              className="text-[var(--brand-crimson)]"
                            />
                            <span dir="ltr">{user.phoneNumber}</span>
                          </a>
                        </td>

                        {/* Created date */}
                        <td className="px-6 py-4 font-medium text-[var(--text-secondary)]">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Bookings Count */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2.5 py-1 font-bold text-[var(--text-primary)]">
                            <CalendarDays
                              size={12}
                              className="text-[var(--brand-crimson)]"
                            />
                            <span>
                              {user._count.bookings.toLocaleString("fa-IR")}
                            </span>
                          </span>
                        </td>

                        {/* Generations Count */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2.5 py-1 font-bold text-[var(--text-primary)]">
                            <Sparkles size={12} className="text-purple-600" />
                            <span>
                              {user._count.generations.toLocaleString("fa-IR")}
                            </span>
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              user.role === "ADMIN"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {user.role === "ADMIN" ? "مدیر سالن" : "مشتری"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-[var(--border-subtle)] p-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
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
              disabled={page >= totalPages || isLoading}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
            >
              صفحه بعد →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
