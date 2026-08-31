"use client";

import { useEffect, useState } from "react";

type TimeSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  createdAt: string;
};

type TimeSlotForm = {
  date: string;
  startTime: string;
  endTime: string;
  capacity: string;
};

const initialForm: TimeSlotForm = {
  date: "",
  startTime: "",
  endTime: "",
  capacity: "1",
};

function getLocalDateTimeParts(value: string) {
  const date = new Date(value);

  return {
    date: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
    time: [
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
    ].join(":"),
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function createDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function TimeSlotManagement() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState<TimeSlotForm>(initialForm);

  useEffect(() => {
    let cancelled = false;

    async function fetchTimeSlots() {
      try {
        const response = await fetch("/api/time-slots", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load time slots.");
        }

        if (!cancelled) {
          setTimeSlots(data.timeSlots);
        }
      } catch (error) {
        console.error("Failed to load time slots:", error);

        if (!cancelled) {
          setError("خطا در دریافت زمان‌های قابل رزرو.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTimeSlots();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  }

  function handleInputChange(field: keyof TimeSlotForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function startEditing(timeSlot: TimeSlot) {
    const start = getLocalDateTimeParts(timeSlot.startsAt);
    const end = getLocalDateTimeParts(timeSlot.endsAt);

    setEditingId(timeSlot.id);

    setForm({
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      capacity: String(timeSlot.capacity),
    });

    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.date || !form.startTime || !form.endTime) {
      setError("لطفاً تاریخ، زمان شروع و زمان پایان را وارد کنید.");
      return;
    }

    // Built only for client-side validation — the raw strings are what
    // actually get sent to the API, matching what the backend expects.
    const startsAtDate = createDateTime(form.date, form.startTime);
    const endsAtDate = createDateTime(form.date, form.endTime);
    const capacity = Number(form.capacity);

    if (
      Number.isNaN(startsAtDate.getTime()) ||
      Number.isNaN(endsAtDate.getTime())
    ) {
      setError("لطفاً تاریخ و زمان معتبر وارد کنید.");
      return;
    }

    if (endsAtDate <= startsAtDate) {
      setError("زمان پایان باید بعد از زمان شروع باشد.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
      setError("ظرفیت باید یک عدد صحیح بین ۱ تا ۱۰۰ باشد.");
      return;
    }

    const isEditing = editingId !== null;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        isEditing ? `/api/time-slots/${editingId}` : "/api/time-slots",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: form.date,
            startsAt: form.startTime,
            endsAt: form.endTime,
            capacity,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save time slot.");
      }

      if (isEditing) {
        setTimeSlots((currentTimeSlots) =>
          currentTimeSlots.map((timeSlot) =>
            timeSlot.id === editingId ? data.timeSlot : timeSlot,
          ),
        );
      } else {
        setTimeSlots((currentTimeSlots) => [
          ...currentTimeSlots,
          data.timeSlot,
        ]);
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save time slot:", error);

      if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError("خطا در ذخیره زمان قابل رزرو.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(timeSlot: TimeSlot) {
    const confirmed = window.confirm(
      "آیا از حذف این زمان قابل رزرو مطمئن هستید؟",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/time-slots/${timeSlot.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete time slot.");
      }

      setTimeSlots((currentTimeSlots) =>
        currentTimeSlots.filter(
          (currentTimeSlot) => currentTimeSlot.id !== timeSlot.id,
        ),
      );

      if (editingId === timeSlot.id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete time slot:", error);

      if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError("خطا در حذف زمان قابل رزرو.");
      }
    }
  }

  return (
    <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Time slots list */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.06)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            زمان‌های قابل رزرو
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            این زمان‌ها برای تمام خدمات سالن مشترک هستند.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            در حال دریافت زمان‌ها...
          </p>
        ) : timeSlots.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            هنوز زمان قابل رزروی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {timeSlots.map((timeSlot) => (
              <div
                key={timeSlot.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {formatDateTime(timeSlot.startsAt)}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      تا {formatDateTime(timeSlot.endsAt)}
                    </p>

                    <p className="mt-3 text-sm text-[var(--text-secondary)]">
                      ظرفیت:{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {timeSlot.capacity}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(timeSlot)}
                      className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)]"
                    >
                      ویرایش
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(timeSlot)}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit form */}
      <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[0_20px_60px_rgba(36,20,23,0.06)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {editingId ? "ویرایش زمان" : "افزودن زمان"}
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {editingId
              ? "اطلاعات زمان قابل رزرو را ویرایش کنید."
              : "یک زمان قابل رزرو جدید برای سالن ایجاد کنید."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Date */}
          <div>
            <label
              htmlFor="time-slot-date"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              تاریخ
            </label>

            <input
              id="time-slot-date"
              name="date"
              type="date"
              value={form.date}
              onChange={(event) =>
                handleInputChange("date", event.target.value)
              }
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Start time */}
          <div>
            <label
              htmlFor="time-slot-start"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              زمان شروع
            </label>

            <input
              id="time-slot-start"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={(event) =>
                handleInputChange("startTime", event.target.value)
              }
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* End time */}
          <div>
            <label
              htmlFor="time-slot-end"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              زمان پایان
            </label>

            <input
              id="time-slot-end"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={(event) =>
                handleInputChange("endTime", event.target.value)
              }
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Capacity */}
          <div>
            <label
              htmlFor="time-slot-capacity"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              ظرفیت
            </label>

            <input
              id="time-slot-capacity"
              name="capacity"
              type="number"
              min="1"
              max="100"
              step="1"
              value={form.capacity}
              onChange={(event) =>
                handleInputChange("capacity", event.target.value)
              }
              required
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-crimson)] focus:ring-3 focus:ring-[var(--brand-crimson)]/10"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[var(--brand-crimson)] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[var(--brand-crimson-hover)] hover:shadow-lg hover:shadow-[var(--brand-crimson)]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "در حال ذخیره..."
                : editingId
                  ? "ذخیره تغییرات"
                  : "افزودن زمان"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-3.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-warm)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
