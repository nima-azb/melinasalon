"use client";

import {
  CalendarDays,
  Check,
  Loader2,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { JalaliDatePicker } from "../ui/jalali-date-picker";

export type EditableAdminUser = {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  birthDate: string | null;
  role: "USER" | "ADMIN";
};

type AdminEditUserModalProps = {
  user: EditableAdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function toDateInputString(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminEditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: AdminEditUserModalProps) {
  if (!isOpen || !user) {
    return null;
  }

  return (
    <AdminEditUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

type AdminEditUserModalContentProps = {
  user: EditableAdminUser;
  onClose: () => void;
  onSuccess?: () => void;
};

function AdminEditUserModalContent({
  user,
  onClose,
  onSuccess,
}: AdminEditUserModalContentProps) {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [birthDate, setBirthDate] = useState(() =>
    toDateInputString(user.birthDate),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleClose() {
    if (submitting) {
      return;
    }
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          fullName: fullName.trim() || null,
          birthDate: birthDate.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "ویرایش اطلاعات کاربر با خطا مواجه شد.",
        );
      }

      setSuccessMessage(data.message || "اطلاعات کاربر با موفقیت ویرایش شد.");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در ویرایش اطلاعات کاربر.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
              <Pencil size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                ویرایش مشخصات کاربر
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                تغییر نام و تاریخ تولد مشتری در سیستم سالن ملینا
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
          {/* Phone Number (Read-only reference) */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
              <Phone size={13} className="text-[var(--brand-crimson)]" />
              <span>شماره موبایل (غیرقابل تغییر)</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              value={user.phoneNumber}
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)]/60 px-3.5 py-2.5 text-left text-xs font-bold text-[var(--text-secondary)] opacity-75"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <User size={13} className="text-[var(--brand-crimson)]" />
              <span>نام و نام خانوادگی</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: مریم کریمی"
              disabled={submitting}
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
            />
          </div>

          {/* Birth Date */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <CalendarDays
                  size={13}
                  className="text-[var(--brand-crimson)]"
                />
                <span>تاریخ تولد</span>
              </label>

              {birthDate ? (
                <button
                  type="button"
                  onClick={() => setBirthDate("")}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 transition hover:text-rose-700"
                >
                  <Trash2 size={12} />
                  <span>حذف تاریخ تولد</span>
                </button>
              ) : (
                <span className="text-[10px] text-[var(--text-secondary)]">
                  جهت دریافت خودکار پیامک و کد تخفیف تولد
                </span>
              )}
            </div>

            <JalaliDatePicker
              value={birthDate}
              onChange={(dateStr) => setBirthDate(dateStr)}
              placeholder="انتخاب تاریخ تولد (در صورت تمایل)"
            />
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
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
