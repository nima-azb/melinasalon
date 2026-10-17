"use client";

import {
  CalendarDays,
  Check,
  Loader2,
  Phone,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { JalaliDatePicker } from "../ui/jalali-date-picker";

type AdminCreateUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AdminCreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function resetForm() {
    setFullName("");
    setPhoneNumber("");
    setBirthDate("");
    setRole("USER");
    setError(null);
    setSuccessMessage(null);
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      setError("لطفاً شماره تلفن همراه مشتری را وارد کنید.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          phoneNumber: phoneNumber.trim(),
          birthDate: birthDate.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "ثبت کاربر با خطا مواجه شد.");
      }

      setSuccessMessage(
        data.message || "کاربر جدید با موفقیت به سیستم اضافه شد.",
      );

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت کاربر.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
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
              <User size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                افزودن کاربر جدید دستی
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                ثبت مشخصات کاربر در سیستم سالن ملینا
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
          {/* Full Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <User size={13} className="text-[var(--brand-crimson)]" />
              <span>نام و نام خانوادگی (اختیاری)</span>
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

          {/* Phone Number */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Phone size={13} className="text-[var(--brand-crimson)]" />
              <span>شماره موبایل *</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09123456789"
              required
              disabled={submitting}
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-left text-xs font-bold text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
            />
          </div>

          {/* Birth Date (Optional) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <CalendarDays
                  size={13}
                  className="text-[var(--brand-crimson)]"
                />
                <span>تاریخ تولد (اختیاری)</span>
              </label>
              <span className="text-[10px] text-[var(--text-secondary)]">
                جهت دریافت خودکار پیامک و کد تخفیف تولد
              </span>
            </div>
            <JalaliDatePicker
              value={birthDate}
              onChange={(dateStr) => setBirthDate(dateStr)}
              placeholder="انتخاب تاریخ تولد (در صورت تمایل)"
            />
          </div>

          {/* User Role */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Shield size={13} className="text-[var(--brand-crimson)]" />
              <span>نقش کاربری</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`rounded-2xl border py-2.5 px-3 text-xs font-bold transition ${
                  role === "USER"
                    ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                مشتری عادی (USER)
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`rounded-2xl border py-2.5 px-3 text-xs font-bold transition ${
                  role === "ADMIN"
                    ? "border-purple-300 bg-purple-50 text-purple-700"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                مدیر سالن (ADMIN)
              </button>
            </div>
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
              disabled={submitting || !phoneNumber.trim()}
              className="flex items-center gap-2 rounded-2xl bg-[var(--brand-crimson)] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>ثبت کاربر</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
