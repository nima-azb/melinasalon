"use client";

import { Phone, User } from "lucide-react";
import { useEffect, useState } from "react";

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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/users");
        const data = (await response.json()) as {
          success: boolean;
          message?: string;
          users?: AdminUser[];
        };

        if (!response.ok || !data.success || !data.users) {
          throw new Error(data.message || "خطا در دریافت کاربران.");
        }

        if (!cancelled) {
          setUsers(data.users);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "خطا در دریافت کاربران.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm">
      <div className="border-b border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          کاربران سالن
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          لیست مشتریانی که در سالن ثبت‌نام کرده‌اند
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-[var(--bg-card-warm)]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-700">{error}</div>
      ) : !users || users.length === 0 ? (
        <div className="p-10 text-center text-sm text-[var(--text-secondary)]">
          هنوز کاربری ثبت‌نام نکرده است.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-right text-xs text-[var(--text-secondary)]">
                <th className="px-6 py-3 font-medium">مشتری</th>
                <th className="px-6 py-3 font-medium">شماره تماس</th>
                <th className="px-6 py-3 font-medium">تاریخ ثبت‌نام</th>
                <th className="px-6 py-3 font-medium">تعداد نوبت</th>
                <th className="px-6 py-3 font-medium">تصاویر هوش مصنوعی</th>
                <th className="px-6 py-3 font-medium">نقش</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                        <User size={14} />
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {user.fullName || "وارد نشده"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-3.5 text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} />
                      {user.phoneNumber}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 text-[var(--text-secondary)]">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-6 py-3.5 text-[var(--text-primary)]">
                    {user._count.bookings}
                  </td>

                  <td className="px-6 py-3.5 text-[var(--text-primary)]">
                    {user._count.generations}
                  </td>

                  <td className="px-6 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                          : "bg-[var(--bg-card-warm)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {user.role === "ADMIN" ? "مدیر" : "مشتری"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
