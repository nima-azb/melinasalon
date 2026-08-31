"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
  isActive: boolean;
  createdAt: string;
};

type ServiceForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  duration: "60",
  price: "",
};

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");

  const [editForm, setEditForm] = useState<ServiceForm>(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function fetchServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load services.");
        }

        if (!cancelled) {
          setServices(data.services);
        }
      } catch (error) {
        console.error("Failed to load services:", error);

        if (!cancelled) {
          setError("خطا در دریافت خدمات.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          duration: Number(duration),
          price: price ? Number(price) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create service.");
      }

      setServices((currentServices) => [...currentServices, data.service]);

      setName("");
      setDescription("");
      setDuration("60");
      setPrice("");
    } catch (error) {
      console.error("Failed to create service:", error);

      setError("خطا در ایجاد خدمت.");
    } finally {
      setCreating(false);
    }
  }

  function startEditing(service: Service) {
    setError("");
    setEditingServiceId(service.id);

    setEditForm({
      name: service.name,
      description: service.description ?? "",
      duration: String(service.duration),
      price: service.price !== null ? String(service.price) : "",
    });
  }

  function cancelEditing() {
    setEditingServiceId(null);
    setEditForm(emptyForm);
    setError("");
  }

  function updateEditField(field: keyof ServiceForm, value: string) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleUpdateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingServiceId) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/services/${editingServiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          duration: Number(editForm.duration),
          price: editForm.price ? Number(editForm.price) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update service.");
      }

      setServices((currentServices) =>
        currentServices.map((service) =>
          service.id === editingServiceId ? data.service : service,
        ),
      );

      cancelEditing();
    } catch (error) {
      console.error("Failed to update service:", error);

      setError("خطا در ویرایش خدمت.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleService(service: Service) {
    try {
      setError("");

      const response = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !service.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update service.");
      }

      setServices((currentServices) =>
        currentServices.map((currentService) =>
          currentService.id === service.id ? data.service : currentService,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle service:", error);

      setError("خطا در تغییر وضعیت خدمت.");
    }
  }

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Services list */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.06)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            خدمات
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            خدمات ثبت‌شده سالن
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            در حال دریافت خدمات...
          </p>
        ) : services.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            هنوز خدمتی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4"
              >
                {editingServiceId === service.id ? (
                  <form onSubmit={handleUpdateService} className="space-y-4">
                    {/* Edit name */}
                    <div>
                      <label
                        htmlFor={`edit-name-${service.id}`}
                        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        نام خدمت
                      </label>

                      <input
                        id={`edit-name-${service.id}`}
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          updateEditField("name", event.target.value)
                        }
                        required
                        maxLength={100}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
                      />
                    </div>

                    {/* Edit description */}
                    <div>
                      <label
                        htmlFor={`edit-description-${service.id}`}
                        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        توضیحات
                      </label>

                      <textarea
                        id={`edit-description-${service.id}`}
                        value={editForm.description}
                        onChange={(event) =>
                          updateEditField("description", event.target.value)
                        }
                        maxLength={1000}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
                      />
                    </div>

                    {/* Edit duration */}
                    <div>
                      <label
                        htmlFor={`edit-duration-${service.id}`}
                        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        مدت (دقیقه)
                      </label>

                      <input
                        id={`edit-duration-${service.id}`}
                        type="number"
                        min="1"
                        max="480"
                        value={editForm.duration}
                        onChange={(event) =>
                          updateEditField("duration", event.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
                      />
                    </div>

                    {/* Edit price */}
                    <div>
                      <label
                        htmlFor={`edit-price-${service.id}`}
                        className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        قیمت (تومان)
                      </label>

                      <input
                        id={`edit-price-${service.id}`}
                        type="number"
                        min="0"
                        value={editForm.price}
                        onChange={(event) =>
                          updateEditField("price", event.target.value)
                        }
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
                      />
                    </div>

                    {/* Edit actions */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-[var(--brand-crimson)] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleService(service)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          service.isActive
                            ? "bg-[var(--brand-crimson)]/10 text-[var(--brand-crimson)] hover:bg-[var(--brand-crimson)]/20"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {service.isActive ? "فعال" : "غیرفعال"}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-5 text-sm text-[var(--text-secondary)]">
                        <span>{service.duration} دقیقه</span>

                        {service.price !== null && (
                          <span>
                            {service.price.toLocaleString("fa-IR")} تومان
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditing(service)}
                        className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)]"
                      >
                        ویرایش
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create service */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.06)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          افزودن خدمت
        </h2>

        <form onSubmit={handleCreateService} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="service-name"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              نام خدمت
            </label>

            <input
              id="service-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={100}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="service-description"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              توضیحات
            </label>

            <textarea
              id="service-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="service-duration"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              مدت (دقیقه)
            </label>

            <input
              id="service-duration"
              name="duration"
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="service-price"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              قیمت (تومان)
            </label>

            <input
              id="service-price"
              name="price"
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "در حال ایجاد..." : "افزودن خدمت"}
          </button>
        </form>
      </div>
    </section>
  );
}
