"use client";

import {
  Check,
  Clock,
  Edit2,
  ImageUp,
  Layers,
  Loader2,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { parseServicePackages } from "@/lib/services/service-capacity";

function toEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  if (typeof str === "number") return String(str);
  return String(str)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/,/g, "")
    .trim();
}

export type ServicePackageFormItem = {
  id: string;
  name: string;
  price: number | string;
  duration?: number | string;
  description?: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
  imageUrl: string | null;
  capacity: number;
  oneBookingPerDay: boolean;
  isActive: boolean;
  packages?: unknown;
  linkedServiceIds?: string[];
};

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  price: number | string;
  imageUrl: string;
  capacity: number;
  oneBookingPerDay: boolean;
  isActive: boolean;
  hasPackages: boolean;
  packages: ServicePackageFormItem[];
  isCombined: boolean;
  linkedServiceIds: string[];
};

type ApiResponse = {
  success: boolean;
  message?: string;
  services?: Service[];
  service?: Service;
  imageUrl?: string;
  errors?: unknown;
};

const initialForm: ServiceForm = {
  name: "",
  description: "",
  duration: 30,
  price: "",
  imageUrl: "",
  capacity: 1,
  oneBookingPerDay: false,
  isActive: true,
  hasPackages: false,
  packages: [],
  isCombined: false,
  linkedServiceIds: [],
};

async function parseApiResponse(response: Response): Promise<ApiResponse> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = (await response.json()) as ApiResponse;
    if (!response.ok && json.errors && typeof json.errors === "object") {
      const fieldErrors = (
        json.errors as { fieldErrors?: Record<string, string[]> }
      ).fieldErrors;
      if (fieldErrors) {
        const details = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${msgs.join("، ")}`)
          .join(" | ");
        if (details) {
          json.message = `${json.message || "خطای اعتبارسنجی"}: ${details}`;
        }
      }
    }
    return json;
  }
  const text = await response.text();
  return {
    success: false,
    message: `خطای سرور (${response.status}): ${text.slice(0, 100) || "پاسخ نامعتبر"}`,
  };
}

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/services", {
        cache: "no-store",
      });

      const data = await parseApiResponse(response);

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
    const parsedPkgs = parseServicePackages(service.packages);
    const hasPkgs = parsedPkgs.length > 0;
    const linkedIds = Array.isArray(service.linkedServiceIds)
      ? service.linkedServiceIds
      : [];

    setForm({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price:
        service.price !== null && service.price !== undefined
          ? service.price
          : "",
      imageUrl: service.imageUrl || "",
      capacity: service.capacity,
      oneBookingPerDay: service.oneBookingPerDay,
      isActive: service.isActive,
      hasPackages: hasPkgs,
      packages: hasPkgs
        ? parsedPkgs.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            duration: p.duration ?? "",
            description: p.description ?? "",
          }))
        : [],
      isCombined: linkedIds.length > 0,
      linkedServiceIds: linkedIds,
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

  function handleAddThreePackagesPreset() {
    setForm((prev) => ({
      ...prev,
      hasPackages: true,
      packages: [
        { id: `pkg-${Date.now()}-1`, name: "اقتصادی", price: "", duration: "" },
        { id: `pkg-${Date.now()}-2`, name: "لوکس", price: "", duration: "" },
        { id: `pkg-${Date.now()}-3`, name: "VIP", price: "", duration: "" },
      ],
    }));
  }

  function handleAddPackage() {
    setForm((prev) => ({
      ...prev,
      hasPackages: true,
      packages: [
        ...prev.packages,
        { id: `pkg-${Date.now()}`, name: "", price: "", duration: "" },
      ],
    }));
  }

  function handleRemovePackage(index: number) {
    setForm((prev) => {
      const next = prev.packages.filter((_, i) => i !== index);
      return {
        ...prev,
        packages: next,
        hasPackages: next.length > 0,
      };
    });
  }

  function handlePackageChange(
    index: number,
    field: keyof ServicePackageFormItem,
    val: string | number,
  ) {
    setForm((prev) => {
      const next = [...prev.packages];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, packages: next };
    });
  }

  function handleToggleLinkedService(targetId: string) {
    setForm((prev) => {
      const exists = prev.linkedServiceIds.includes(targetId);
      const next = exists
        ? prev.linkedServiceIds.filter((id) => id !== targetId)
        : [...prev.linkedServiceIds, targetId];
      return {
        ...prev,
        linkedServiceIds: next,
      };
    });
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("لطفاً یک فایل تصویری معتبر (JPEG, PNG, WebP) انتخاب کنید.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/services/upload", {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(response);

      if (!response.ok || !data.success || !("imageUrl" in data)) {
        throw new Error(data.message || "خطا در بارگذاری تصویر در ابر آروان.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: (data as { imageUrl: string }).imageUrl,
      }));
    } catch (err) {
      console.error("Failed to upload image:", err);
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تصویر.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function handleRemoveImage() {
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("نام خدمت الزامی است.");
      return;
    }

    const cleanDuration = Number(toEnglishDigits(form.duration));
    if (!cleanDuration || cleanDuration <= 0) {
      setError("مدت زمان خدمت باید بیشتر از صفر باشد.");
      return;
    }

    if (form.hasPackages) {
      if (form.packages.length === 0) {
        setError(
          "شما گزینه پکیج‌ها را فعال کرده‌اید. لطفاً حداقل یک پکیج اضافه کنید یا تیک داشتن پکیج را بردارید.",
        );
        return;
      }

      const invalid = form.packages.some((p) => {
        const cleanPrice = toEnglishDigits(p.price);
        return !p.name.trim() || cleanPrice === "" || Number(cleanPrice) < 0;
      });

      if (invalid) {
        setError(
          "لطفاً نام و قیمت معتبر برای تمام پکیج‌های تعریف‌شده وارد کنید.",
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formattedPackages = form.hasPackages
        ? form.packages
            .filter((p) => p.name.trim() && toEnglishDigits(p.price) !== "")
            .map((p, idx) => {
              const cleanDurationStr = toEnglishDigits(p.duration);
              const cleanDurationNum = cleanDurationStr
                ? Number(cleanDurationStr)
                : null;
              return {
                id: p.id || `pkg-${idx + 1}`,
                name: p.name.trim(),
                price: Math.round(Number(toEnglishDigits(p.price))) || 0,
                duration:
                  cleanDurationNum && cleanDurationNum > 0
                    ? cleanDurationNum
                    : null,
              };
            })
        : [];

      const formattedLinked = form.isCombined ? form.linkedServiceIds : [];

      const cleanBasePriceStr = toEnglishDigits(form.price);
      const cleanBasePrice =
        cleanBasePriceStr !== "" && !Number.isNaN(Number(cleanBasePriceStr))
          ? Math.round(Number(cleanBasePriceStr))
          : null;

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
          duration: cleanDuration,
          price: cleanBasePrice,
          imageUrl: form.imageUrl.trim() || null,
          capacity: Number(toEnglishDigits(form.capacity)) || 1,
          oneBookingPerDay: form.oneBookingPerDay,
          isActive: form.isActive,
          packages: formattedPackages,
          linkedServiceIds: formattedLinked,
        }),
      });

      const data = await parseApiResponse(response);

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

      const data = await parseApiResponse(response);

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

      const data = await parseApiResponse(response);

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
            تعریف خدمات، پکیج‌های قیمتی (اقتصادی، لوکس، VIP)، ترکیب خدمات همزمان
            و فعال‌سازی رزرو آنلاین
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
                  placeholder="مثلاً میکاپ، شینیون، میکاپ و شینیون..."
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:bg-[var(--bg-card)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  مدت زمان پیش‌فرض (دقیقه) *
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
                  هزینه پایه خدمت (تومان)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  placeholder="مثلاً ۳۵۰,۰۰۰ (در صورت داشتن پکیج، قیمت پکیج‌ها اولویت دارد)"
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

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">
                  تصویر خدمت (فضای ذخیره‌سازی ابری آروان)
                </label>

                {form.imageUrl ? (
                  <div className="relative flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-white shadow-xs">
                        <Image
                          src={form.imageUrl}
                          alt="پیش‌نمایش تصویر خدمت"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <Check size={11} />
                            تصویر بارگذاری شده در ابر آروان
                          </span>
                        </div>
                        <p className="mt-1 max-w-xs truncate text-[10px] text-[var(--text-secondary)] font-mono dir-ltr text-left">
                          {form.imageUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <label className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--brand-crimson-light)] hover:text-[var(--brand-crimson)]">
                        <ImageUp size={13} />
                        <span>تغییر تصویر</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage || submitting}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage || submitting}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                        title="حذف تصویر"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      uploadingImage
                        ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)]/40 opacity-75"
                        : "border-[var(--border-subtle)] bg-[var(--bg-card-warm)] hover:border-[var(--brand-crimson)] hover:bg-[var(--brand-crimson-light)]/20"
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 text-xs font-bold text-[var(--brand-crimson)]">
                        <Loader2 size={24} className="animate-spin" />
                        <span>در حال بارگذاری تصویر در فضای ابری آروان...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--brand-crimson)] shadow-xs">
                          <ImageUp size={20} />
                        </div>
                        <span className="mt-2 text-xs font-bold text-[var(--text-primary)]">
                          برای انتخاب و بارگذاری تصویر کلیک کنید
                        </span>
                        <span className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                          فرمت‌های مجاز: JPEG, PNG, WebP (حداکثر ۱۰ مگابایت)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage || submitting}
                      className="hidden"
                    />
                  </label>
                )}
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

            {/* بخش ۱: پکیج‌های قیمتی خدمت */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={form.hasPackages}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        hasPackages: e.target.checked,
                        packages:
                          e.target.checked && prev.packages.length === 0
                            ? [
                                {
                                  id: `pkg-${Date.now()}-1`,
                                  name: "اقتصادی",
                                  price: "",
                                  duration: "",
                                },
                                {
                                  id: `pkg-${Date.now()}-2`,
                                  name: "لوکس",
                                  price: "",
                                  duration: "",
                                },
                                {
                                  id: `pkg-${Date.now()}-3`,
                                  name: "VIP",
                                  price: "",
                                  duration: "",
                                },
                              ]
                            : prev.packages,
                      }))
                    }
                    className="h-4 w-4 rounded accent-[var(--brand-crimson)]"
                  />
                  <span>
                    این خدمت دارای پکیج‌های متنوع است (مانند: اقتصادی، لوکس،
                    VIP)
                  </span>
                </label>

                {form.hasPackages && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddThreePackagesPreset}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-200 transition hover:bg-amber-100"
                    >
                      <Sparkles size={13} className="text-amber-600" />
                      <span>قالب آماده ۳ پکیج (اقتصادی، لوکس، VIP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPackage}
                      className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-crimson)] border border-[var(--border-subtle)] hover:bg-[var(--brand-crimson-light)]"
                    >
                      <Plus size={13} />
                      <span>افزودن پکیج</span>
                    </button>
                  </div>
                )}
              </div>

              {form.hasPackages && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-[11px] text-[var(--text-secondary)] leading-5">
                    مشتری در هنگام رزرو، پکیج مدنظر خود را انتخاب خواهد کرد و
                    قیمت و مدت زمان بر اساس پکیج محاسبه می‌شود:
                  </p>

                  {form.packages.map((pkg, idx) => (
                    <div
                      key={pkg.id || idx}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold text-[var(--text-secondary)]">
                          نام پکیج *
                        </label>
                        <input
                          type="text"
                          required
                          value={pkg.name}
                          onChange={(e) =>
                            handlePackageChange(idx, "name", e.target.value)
                          }
                          placeholder="مثلاً اقتصادی، لوکس، VIP"
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold text-[var(--text-secondary)]">
                          مبلغ پکیج (تومان) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          step={10000}
                          value={pkg.price}
                          onChange={(e) =>
                            handlePackageChange(idx, "price", e.target.value)
                          }
                          placeholder="مثلاً ۱,۵۰۰,۰۰۰"
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                        />
                      </div>

                      <div className="w-28">
                        <label className="mb-1 block text-[10px] font-bold text-[var(--text-secondary)]">
                          مدت (اختیاری)
                        </label>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={pkg.duration ?? ""}
                          onChange={(e) =>
                            handlePackageChange(idx, "duration", e.target.value)
                          }
                          placeholder={`${form.duration} دقیقه`}
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)]"
                        />
                      </div>

                      <div className="self-end pt-1 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemovePackage(idx)}
                          className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50"
                          title="حذف این پکیج"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* بخش ۲: ارتباط دادن و خدمت ترکیبی */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={form.isCombined}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isCombined: e.target.checked,
                      linkedServiceIds: e.target.checked
                        ? prev.linkedServiceIds
                        : [],
                    }))
                  }
                  className="h-4 w-4 rounded accent-[var(--brand-crimson)]"
                />
                <span className="flex items-center gap-1.5">
                  <Layers size={14} className="text-[var(--brand-crimson)]" />
                  <span>
                    این یک خدمت ترکیبی است (اشتراک و همپوشانی ظرفیت با سایر
                    خدمات)
                  </span>
                </span>
              </label>

              {form.isCombined && (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] text-[var(--text-secondary)] leading-5">
                    خدماتی که این پکیج از ظرفیت آنها استفاده می‌کند را تیک
                    بزنید. با رزرو شدن این خدمت در هر تاریخ و ساعت، ظرفیت خدمات
                    انتخاب‌شده کسر شده و آن زمان برای آنها نیز بسته خواهد شد:
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {services
                      .filter((s) => s.id !== editingId)
                      .map((s) => {
                        const isChecked = form.linkedServiceIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                              isChecked
                                ? "border-[var(--brand-crimson)] bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                                : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--brand-crimson)]/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleLinkedService(s.id)}
                              className="h-4 w-4 rounded accent-[var(--brand-crimson)]"
                            />
                            <span>{s.name}</span>
                          </label>
                        );
                      })}
                  </div>

                  {services.filter((s) => s.id !== editingId).length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      ابتدا خدمات پایه (مانند میکاپ و شینیون) را ثبت کنید تا
                      بتوانید آنها را با این خدمت ارتباط دهید.
                    </p>
                  )}
                </div>
              )}
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
            const packages = parseServicePackages(service.packages);
            const linkedIds = Array.isArray(service.linkedServiceIds)
              ? service.linkedServiceIds
              : [];
            const linkedNames = linkedIds
              .map((id) => services.find((s) => s.id === id)?.name)
              .filter(Boolean);

            const minPackagePrice =
              packages.length > 0
                ? Math.min(...packages.map((p) => p.price))
                : null;

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

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
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

                    {linkedNames.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-crimson)]/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          <Layers size={11} />
                          <span>ترکیبی</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {service.description}
                    </p>
                  )}

                  {/* Badges for linked components */}
                  {linkedNames.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                      <span className="font-semibold text-[10px]">
                        اشتراک با:
                      </span>
                      {linkedNames.map((n, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-700 border border-stone-200"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Badges for packages */}
                  {packages.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                      {packages.map((pkg) => (
                        <span
                          key={pkg.id}
                          className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200"
                          title={`${pkg.name}: ${pkg.price.toLocaleString("fa-IR")} تومان`}
                        >
                          {pkg.name}: {pkg.price.toLocaleString("fa-IR")} ت
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[11px] font-bold text-[var(--brand-crimson)]">
                      <span>
                        {minPackagePrice !== null
                          ? `از ${minPackagePrice.toLocaleString("fa-IR")} تومان (${packages.length} پکیج)`
                          : service.price !== null &&
                              service.price !== undefined
                            ? `${service.price.toLocaleString("fa-IR")} تومان`
                            : ""}
                      </span>
                    </span>

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
