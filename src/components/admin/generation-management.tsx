"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type WorkflowType = "CUSTOM" | "RECOMMENDATION";

type Generation = {
  id: string;
  userId: string;
  workflowType: WorkflowType;
  originalPhotoUrl: string;
  resultPhotoUrl: string;
  styleChosen: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName?: string | null;
    phoneNumber: string;
  };
};

type GenerationWithImages = Generation & {
  originalUrl: string;
  resultUrl: string;
};

type CustomStyle = {
  hairColor?: string;
  hairstyle?: string;
  makeup?: string;
};

type RecommendationStyle = {
  type?: string;
  lookCount?: number;
  look1?: string;
  look2?: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function parseStyle(styleChosen: string | null) {
  if (!styleChosen) {
    return null;
  }

  try {
    return JSON.parse(styleChosen) as CustomStyle | RecommendationStyle | null;
  } catch {
    return null;
  }
}

function isRecommendationStyle(
  style: CustomStyle | RecommendationStyle | null,
): style is RecommendationStyle {
  return Boolean(
    style &&
    ("type" in style ||
      "lookCount" in style ||
      "look1" in style ||
      "look2" in style),
  );
}

function getWorkflowLabel(workflowType: WorkflowType) {
  return workflowType === "RECOMMENDATION"
    ? "پیشنهاد هوش مصنوعی"
    : "استایل اختصاصی";
}

function getWorkflowClass(workflowType: WorkflowType) {
  return workflowType === "RECOMMENDATION"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700";
}

export function GenerationManagement() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [images, setImages] = useState<Record<string, GenerationWithImages>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGenerations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/generations", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load generations.");
        }

        if (!cancelled) {
          setGenerations(data.generations ?? []);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load generations:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load generations.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGenerations();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadImages(generation: Generation) {
    if (images[generation.id] || imageLoading[generation.id]) {
      return;
    }

    try {
      setImageLoading((current) => ({
        ...current,
        [generation.id]: true,
      }));

      const response = await fetch(
        `/api/admin/generations/${generation.id}/images`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load generation images.");
      }

      setImages((current) => ({
        ...current,
        [generation.id]: {
          ...generation,
          originalUrl: data.originalUrl,
          resultUrl: data.resultUrl,
        },
      }));
    } catch (error) {
      console.error("Failed to load generation images:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load generation images.",
      );
    } finally {
      setImageLoading((current) => ({
        ...current,
        [generation.id]: false,
      }));
    }
  }

  if (loading) {
    return (
      <section
        dir="rtl"
        className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          تصاویر هوش مصنوعی
        </h2>

        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          در حال دریافت تصاویر...
        </p>
      </section>
    );
  }

  return (
    <section
      dir="rtl"
      className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            تصاویر هوش مصنوعی
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            مشاهده تصاویر تولیدشده توسط کاربران و جزئیات هر درخواست
          </p>
        </div>

        <div className="rounded-full bg-[var(--bg-card-warm)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
          {new Intl.NumberFormat("fa-IR").format(generations.length)} تصویر
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {generations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            هنوز تصویری توسط کاربران تولید نشده است.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {generations.map((generation) => {
            const generationImages = images[generation.id];
            const style = parseStyle(generation.styleChosen);
            const isImageLoading = imageLoading[generation.id];
            const isRecommendation =
              generation.workflowType === "RECOMMENDATION";

            return (
              <article
                key={generation.id}
                className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)]"
              >
                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            تولید تصویر
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getWorkflowClass(
                              generation.workflowType,
                            )}`}
                          >
                            {getWorkflowLabel(generation.workflowType)}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-[var(--text-secondary)]">
                          شناسه: {generation.id}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void loadImages(generation)}
                        disabled={isImageLoading}
                        className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isImageLoading
                          ? "در حال دریافت..."
                          : generationImages
                            ? "تصاویر دریافت شد"
                            : "نمایش تصاویر"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-[var(--bg-card)] p-4">
                        <p className="text-xs text-[var(--text-secondary)]">
                          مشتری
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {generation.user.fullName || "بدون نام"}
                        </p>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {generation.user.phoneNumber}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[var(--bg-card)] p-4">
                        <p className="text-xs text-[var(--text-secondary)]">
                          تاریخ تولید
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {formatDate(generation.createdAt)}
                        </p>
                      </div>
                    </div>

                    {isRecommendation ? (
                      <div className="mt-4 rounded-xl bg-[var(--bg-card)] p-4">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          پیشنهادهای شخصی‌سازی‌شده
                        </p>

                        <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                          این تصویر شامل دو استایل متفاوت پیشنهادی بر اساس
                          ویژگی‌های قابل مشاهده چهره کاربر است.
                        </p>

                        {isRecommendationStyle(style) && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4">
                              <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Look 1
                              </p>

                              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                                {style.look1 ||
                                  "استایل پیشنهادی اول در تصویر نتیجه نمایش داده می‌شود."}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-4">
                              <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Look 2
                              </p>

                              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                                {style.look2 ||
                                  "استایل پیشنهادی دوم در تصویر نتیجه نمایش داده می‌شود."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      style && (
                        <div className="mt-4 rounded-xl bg-[var(--bg-card)] p-4">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            جزئیات استایل انتخاب‌شده
                          </p>

                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                رنگ مو
                              </p>

                              <p className="mt-1 text-sm text-[var(--text-primary)]">
                                {"hairColor" in style && style.hairColor
                                  ? style.hairColor
                                  : "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                مدل مو
                              </p>

                              <p className="mt-1 text-sm text-[var(--text-primary)]">
                                {"hairstyle" in style && style.hairstyle
                                  ? style.hairstyle
                                  : "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                میکاپ
                              </p>

                              <p className="mt-1 text-sm text-[var(--text-primary)]">
                                {"makeup" in style && style.makeup
                                  ? style.makeup
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-xl bg-[var(--bg-card)]">
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          تصویر اصلی
                        </p>
                      </div>

                      {generationImages ? (
                        <a
                          href={generationImages.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <div className="relative aspect-[3/4]">
                            <Image
                              src={generationImages.originalUrl}
                              alt={`تصویر اصلی ${generation.user.fullName || "کاربر"}`}
                              fill
                              sizes="(max-width: 1024px) 50vw, 180px"
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        </a>
                      ) : (
                        <div className="flex aspect-[3/4] items-center justify-center bg-[var(--bg-card-warm)] p-3 text-center text-xs text-[var(--text-secondary)]">
                          برای مشاهده تصویر، روی «نمایش تصاویر» کلیک کنید.
                        </div>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl bg-[var(--bg-card)]">
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          نتیجه هوش مصنوعی
                        </p>
                      </div>

                      {generationImages ? (
                        <a
                          href={generationImages.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <div className="relative aspect-[3/4]">
                            <Image
                              src={generationImages.resultUrl}
                              alt={`نتیجه هوش مصنوعی ${generation.user.fullName || "کاربر"}`}
                              fill
                              sizes="(max-width: 1024px) 50vw, 180px"
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        </a>
                      ) : (
                        <div className="flex aspect-[3/4] items-center justify-center bg-[var(--bg-card-warm)] p-3 text-center text-xs text-[var(--text-secondary)]">
                          برای مشاهده تصویر، روی «نمایش تصاویر» کلیک کنید.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
