"use client";

import { Calendar, Eye, ImageIcon, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

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

type GenerationsResponse = {
  success: boolean;
  message?: string;
  generations?: Generation[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
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
  if (!styleChosen) return null;
  try {
    return JSON.parse(styleChosen) as CustomStyle | RecommendationStyle | null;
  } catch {
    return null;
  }
}

export function GenerationManagement() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [images, setImages] = useState<Record<string, GenerationWithImages>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [workflowTypeFilter, setWorkflowTypeFilter] = useState<
    "ALL" | WorkflowType
  >("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadGenerations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");

      if (workflowTypeFilter !== "ALL") {
        params.set("workflowType", workflowTypeFilter);
      }

      const response = await fetch(
        `/api/admin/generations?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = (await response.json()) as GenerationsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در دریافت تصاویر هوش مصنوعی.");
      }

      setGenerations(data.generations ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? (data.generations?.length || 0));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در دریافت تصاویر هوش مصنوعی.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, workflowTypeFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGenerations();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadGenerations]);

  async function loadImages(generation: Generation) {
    if (images[generation.id] || imageLoading[generation.id]) return;

    try {
      setImageLoading((prev) => ({ ...prev, [generation.id]: true }));

      const response = await fetch(
        `/api/admin/generations/${generation.id}/images`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "خطا در دریافت تصاویر.");
      }

      setImages((prev) => ({
        ...prev,
        [generation.id]: {
          ...generation,
          originalUrl: data.originalUrl,
          resultUrl: data.resultUrl,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت تصاویر.");
    } finally {
      setImageLoading((prev) => ({ ...prev, [generation.id]: false }));
    }
  }

  return (
    <section className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">
            آرشیو مدل‌های هوش مصنوعی
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            بررسی تصاویر ساخته‌شده و استایل‌های منتخب مراجعین
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "همه مدل‌ها" },
            { id: "RECOMMENDATION", label: "پیشنهاد هوش مصنوعی" },
            { id: "CUSTOM", label: "استایل دلخواه" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setWorkflowTypeFilter(item.id as typeof workflowTypeFilter);
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                workflowTypeFilter === item.id
                  ? "bg-[var(--brand-crimson)] text-white shadow-xs"
                  : "bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}

          <span className="rounded-full bg-[var(--brand-crimson-light)] px-3 py-1 text-xs font-bold text-[var(--brand-crimson)]">
            {totalCount.toLocaleString("fa-IR")} مدل
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {loading && generations.length === 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
          <Sparkles
            size={32}
            className="mx-auto text-[var(--text-secondary)] opacity-40"
          />
          <p className="mt-2 text-xs font-bold text-[var(--text-secondary)]">
            هیچ تصویری با این فیلتر یافت نشد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {generations.map((gen) => {
            const genImages = images[gen.id];
            const isImgLoading = imageLoading[gen.id];
            const style = parseStyle(gen.styleChosen);
            const clientName = gen.user.fullName || "مشتری مهمان";

            return (
              <div
                key={gen.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-xs transition hover:shadow-md"
              >
                <div>
                  {/* Top Header: Client & Mode */}
                  <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-xs font-black text-[var(--brand-crimson)]">
                        {clientName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[var(--text-primary)]">
                          {clientName}
                        </h4>
                        <a
                          href={`tel:${gen.user.phoneNumber}`}
                          className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--brand-crimson)]"
                        >
                          <span dir="ltr">{gen.user.phoneNumber}</span>
                        </a>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        gen.workflowType === "RECOMMENDATION"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {gen.workflowType === "RECOMMENDATION"
                        ? "پیشنهاد هوش مصنوعی"
                        : "استایل دلخواه"}
                    </span>
                  </div>

                  {/* Style Tags */}
                  {style && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {"hairColor" in style && style.hairColor && (
                        <span className="rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                          رنگ مو: {style.hairColor}
                        </span>
                      )}
                      {"hairstyle" in style && style.hairstyle && (
                        <span className="rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                          مدل: {style.hairstyle}
                        </span>
                      )}
                      {"makeup" in style && style.makeup && (
                        <span className="rounded-lg bg-[var(--bg-card-warm)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                          میکاپ: {style.makeup}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Images Area (Before / After) */}
                  <div className="mt-4">
                    {genImages ? (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Original photo */}
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--bg-card-warm)] group">
                          <Image
                            src={genImages.originalUrl}
                            alt="عکس اصلی مشتری"
                            fill
                            className="object-cover"
                          />
                          <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                            عکس اصلی
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage(genImages.originalUrl)
                            }
                            className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <Eye size={13} />
                          </button>
                        </div>

                        {/* Result photo */}
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--bg-card-warm)] ring-2 ring-[var(--brand-crimson-light)] group">
                          <Image
                            src={genImages.resultUrl}
                            alt="نتیجه هوش مصنوعی"
                            fill
                            className="object-cover"
                          />
                          <span className="absolute bottom-2 right-2 rounded-lg bg-[var(--brand-crimson)] px-2 py-0.5 text-[9px] font-bold text-white">
                            نتیجه AI
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage(genImages.resultUrl)
                            }
                            className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void loadImages(gen)}
                        disabled={isImgLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card-warm)] py-8 text-xs font-bold text-[var(--brand-crimson)] transition hover:bg-[var(--brand-crimson-light)] disabled:opacity-50"
                      >
                        <ImageIcon size={18} />
                        <span>
                          {isImgLoading
                            ? "در حال دریافت امن تصاویر..."
                            : "مشاهده تصاویر قبل و بعد"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer timestamp */}
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar size={12} />
                    <span>{formatDate(gen.createdAt)}</span>
                  </div>
                  <span className="text-[10px]">شناسه: {gen.id.slice(-6)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
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
            disabled={page >= totalPages || loading}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-warm)] disabled:opacity-40"
          >
            صفحه بعد →
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X size={18} />
            </button>
            <div className="relative h-[80vh] w-[80vw] max-w-[700px]">
              <Image
                src={lightboxImage}
                alt="تصویر بزرگ‌نمایی شده"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
