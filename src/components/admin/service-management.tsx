"use client";

import {
  Clock,
  Edit2,
  ImageUp,
  Plus,
  Scissors,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  imageUrl: string | null;
  capacity: number;
  oneBookingPerDay: boolean;
  isActive: boolean;
};

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  imageUrl: string;
  capacity: number;
  oneBookingPerDay: boolean;
  isActive: boolean;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  services?: Service[];
  service?: Service;
};

const initialForm: ServiceForm = {
  name: "",
  description: "",
  duration: 30,
  imageUrl: "",
  capacity: 1,
  oneBookingPerDay: false,
  isActive: true,
};

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/services?includeInactive=true", {
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در دریافت لیست خدمات.");
      }

      setServices(data.services ?? []);
    } catch (err) {
      console.error("Failed to load services:", err);
      setError(
        err instanceof Error ? err.message : "خطا در دریافت لیست خدمات.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadServices();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadServices]);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  function handleEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      imageUrl: service.imageUrl || "",
      capacity: service.capacity,
      oneBookingPerDay: service.oneBookingPerDay,
      isActive: service.isActive,
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  function handleCancelForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("نام خدمت الزامی است.");
      return;
    }

    if (form.duration <= 0) {
      setError("مدت زمان خدمت باید بیشتر از صفر باشد.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const url = editingId
        ? `/api/admin/services/${editingId}`
        : "/api/admin/services";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration: Number(form.duration),
          imageUrl: form.imageUrl.trim() || null,
          capacity: Number(form.capacity),
          oneBookingPerDay: form.oneBookingPerDay,
          isActive: form.isActive,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در ثبت خدمت.");
      }

      setSuccess(
        editingId
          ? "خدمت با موفقیت ویرایش شد."
          : "خدمت جدید با موفقیت اضافه شد.",
      );
      handleCancelForm();
      await loadServices();
    } catch (err) {
      console.error("Failed to save service:", err);
      setError(err instanceof Error ? err.message : "خطا در ثبت خدمت.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(service: Service) {
    try {
      setTogglingId(service.id);
      setError(null);

      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !service.isActive,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در تغییر وضعیت خدمت.");
      }

      await loadServices();
    } catch (err) {
      console.error("Failed to toggle service status:", err);
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت خدمت.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("آیا از حذف این خدمت اطمینان دارید؟")) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در حذف خدمت.");
      }

      setSuccess("خدمت با موفقیت حذف شد.");
      await loadServices();
    } catch (err) {
      console.error("Failed to delete service:", err);
      setError(err instanceof Error ? err.message : "خطا در حذف خدمت.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">
            لیست خدمات سالن
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            تعریف خدمات، مدت زمان تقریبی و فعال‌سازی رزرو آنلاین
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-crimson)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)]"
        >
          <Plus size={16} />
          <span>افزودن خدمت جدید</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          {success}
        </div>
      )}

      {/* Modal / Accordion Drawer Form */}
      {isFormOpen && (
        <div className="rounded-3xl border border-[var(--brand-crimson-light)] bg-[var(--bg-card)] p-6 shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              {editingId ? "ویرایش خدمت" : "افزودن خدمت جدید"}
            </h3>

            <button
              type="button"
              onClick={handleCancelForm}
              className="rounded-xl p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)]"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  نام خدمت *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="مثلاً کوتاهی ژورنالی، رنگ و لایت..."
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  مدت زمان انجام (دقیقه) *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  step={5}
                  value={form.duration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  آدرس تصویر خدمت (URL)
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  ظرفیت همزمان (نفر)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      capacity: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                توضیحات و جزئیات خدمت
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="توضیحات تکمیلی برای مشتریان در فرم رزرو..."
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-3 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-[var(--brand-crimson)]"
                />
                <span>خدمت فعال و قابل رزرو آنلاین باشد</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={form.oneBookingPerDay}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      oneBookingPerDay: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded accent-[var(--brand-crimson)]"
                />
                <span>محدود به یک نوبت در روز (خدمات طولانی مانند عروس)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[var(--border-subtle)] pt-4">
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-2xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-warm)]"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[var(--brand-crimson)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-crimson-hover)] disabled:opacity-50"
              >
                {submitting
                  ? "در حال ذخیره..."
                  : editingId
                    ? "ذخیره تغییرات"
                    : "ثبت خدمت"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
          <Scissors
            size={32}
            className="mx-auto text-[var(--text-secondary)] opacity-40"
          />
          <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">
            هنوز هیچ خدمتی ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isDeleting = deletingId === service.id;
            const isToggling = togglingId === service.id;

            return (
              <div
                key={service.id}
                className={`flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-xs transition-all hover:shadow-md ${
                  service.isActive
                    ? "border-[var(--border-subtle)] bg-[var(--bg-card)]"
                    : "border-slate-200 bg-slate-50 opacity-75"
                }`}
              >
                <div>
                  {/* Service Image / Placeholder */}
                  <div className="relative mb-3.5 h-36 w-full overflow-hidden rounded-2xl bg-[var(--bg-card-warm)]">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--text-secondary)] opacity-50">
                        <ImageUp size={30} />
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          service.isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-500 text-white"
                        }`}
                      >
                        {service.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {service.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      <Clock
                        size={12}
                        className="text-[var(--brand-crimson)]"
                      />
                      <span>
                        {service.duration.toLocaleString("fa-IR")} دقیقه
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      <Users
                        size={12}
                        className="text-[var(--brand-crimson)]"
                      />
                      <span>
                        ظرفیت: {service.capacity.toLocaleString("fa-IR")}
                      </span>
                    </span>

                    {service.oneBookingPerDay && (
                      <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        یک نوبت در روز
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(service)}
                    disabled={isToggling}
                    className={`text-xs font-bold transition hover:underline disabled:opacity-50 ${
                      service.isActive ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {service.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(service)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-card-warm)] text-[var(--text-secondary)] transition hover:text-[var(--brand-crimson)]"
                      title="ویرایش خدمت"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      disabled={isDeleting}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                      title="حذف خدمت"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
