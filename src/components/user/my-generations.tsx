"use client";

import {
  Download,
  SplitSquareHorizontal,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  hairColors,
  hairstyles,
  makeupStyles,
} from "@/lib/ai/ai-hairdresser-options";
import { BeforeAfterSlider } from "@/components/ai-hairdresser/before-after-slider";

type WorkflowType = "CUSTOM" | "RECOMMENDATION";

type Generation = {
  id: string;
  workflowType: WorkflowType;
  originalUrl: string;
  resultUrl: string;
  styleChosen: string | null;
  createdAt: string;
};

type MyGenerationsProps = {
  generations: Generation[];
};

type SelectedStyles = {
  hairColor?: string;
  hairstyle?: string;
  makeup?: string;
  instructions?: string | null;
};

type FilterId = "all" | "CUSTOM" | "RECOMMENDATION";

const hairColorLabels = new Map(hairColors.map((o) => [o.id, o.label]));
const hairstyleLabels = new Map(hairstyles.map((o) => [o.id, o.label]));
const makeupLabels = new Map(makeupStyles.map((o) => [o.id, o.label]));

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

// Maps the raw internal option id (e.g. "honey-blonde") stored on the
// generation back to its Persian display label, instead of just
// capitalizing the English id (which is what this used to do).
function formatStyleValue(
  value: string | undefined,
  labels: Map<string, string>,
) {
  if (!value) {
    return "انتخاب نشده";
  }

  return labels.get(value) ?? value;
}

function parseStyles(styleChosen: string | null): SelectedStyles {
  if (!styleChosen) {
    return {};
  }

  try {
    const parsed = JSON.parse(styleChosen);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return {
      hairColor:
        typeof parsed.hairColor === "string" ? parsed.hairColor : undefined,

      hairstyle:
        typeof parsed.hairstyle === "string" ? parsed.hairstyle : undefined,

      makeup: typeof parsed.makeup === "string" ? parsed.makeup : undefined,

      instructions:
        typeof parsed.instructions === "string" ? parsed.instructions : null,
    };
  } catch {
    return {};
  }
}

function WorkflowBadge({ workflowType }: { workflowType: WorkflowType }) {
  if (workflowType === "RECOMMENDATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-crimson-light)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-crimson-dark)]">
        <Sparkles size={13} />
        پیشنهاد هوش مصنوعی
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
      انتخاب شخصی
    </span>
  );
}

export function MyGenerations({ generations }: MyGenerationsProps) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [compareId, setCompareId] = useState<string | null>(null);

  const filteredGenerations = useMemo(() => {
    if (filter === "all") {
      return generations;
    }

    return generations.filter((g) => g.workflowType === filter);
  }, [generations, filter]);

  const compareGeneration = generations.find((g) => g.id === compareId);

  const filters: Array<{ id: FilterId; label: string }> = [
    { id: "all", label: "همه استایل‌ها" },
    { id: "RECOMMENDATION", label: "پیشنهاد هوش مصنوعی" },
    { id: "CUSTOM", label: "انتخاب شخصی" },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-[var(--brand-crimson)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              گالری استایل‌های من
            </h2>
            <span className="rounded-full bg-[var(--bg-card-warm)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
              {generations.length} استایل
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            طراحی‌های ساخته‌شده با آرایشگر هوش مصنوعی ملینا
          </p>
        </div>

        <Link
          href="/ai-hairdresser"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-[var(--brand-crimson-light)] px-4 py-2 text-sm font-semibold text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson)] hover:text-white sm:self-auto"
        >
          <Wand2 size={16} />
          تولید استایل جدید
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
            <Sparkles size={26} />
          </div>

          <p className="mt-4 font-semibold text-[var(--text-primary)]">
            هنوز تصویری تولید نکرده‌اید
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            بعد از داشتن نوبت تأییدشده، می‌توانید از آرایشگر هوش مصنوعی استفاده
            کنید و نتایج خود را اینجا ببینید.
          </p>

          <Link
            href="/ai-hairdresser"
            className="mt-5 inline-flex rounded-full bg-[var(--brand-crimson)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
          >
            آرایشگر هوش مصنوعی
          </Link>
        </div>
      ) : (
        <>
          {/* Filter chips */}
          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? "bg-[var(--brand-crimson)] text-white"
                    : "bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:bg-[var(--brand-crimson-light)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {filteredGenerations.map((generation) => {
              const styles = parseStyles(generation.styleChosen);
              const isRecommendation =
                generation.workflowType === "RECOMMENDATION";

              return (
                <article
                  key={generation.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-card)]">
                    <Image
                      src={generation.resultUrl}
                      alt={
                        isRecommendation
                          ? "دو پیشنهاد شخصی‌سازی‌شده آرایشگر هوش مصنوعی"
                          : "نتیجه آرایشگر هوش مصنوعی"
                      }
                      fill
                      unoptimized
                      sizes="(max-width: 1280px) 50vw, 500px"
                      className="object-cover"
                    />

                    <div className="absolute top-3 right-3">
                      <WorkflowBadge workflowType={generation.workflowType} />
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDate(generation.createdAt)}
                    </p>

                    {isRecommendation ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        دو ظاهر شخصی‌سازی‌شده بر اساس فرم صورت شما.
                      </p>
                    ) : (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-[var(--bg-card)] p-2 text-center">
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            رنگ مو
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                            {formatStyleValue(
                              styles.hairColor,
                              hairColorLabels,
                            )}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[var(--bg-card)] p-2 text-center">
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            مدل مو
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                            {formatStyleValue(
                              styles.hairstyle,
                              hairstyleLabels,
                            )}
                          </p>
                        </div>
                        <div className="rounded-lg bg-[var(--bg-card)] p-2 text-center">
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            میکاپ
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                            {formatStyleValue(styles.makeup, makeupLabels)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCompareId(generation.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-crimson)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-crimson-hover)]"
                      >
                        <SplitSquareHorizontal size={14} />
                        مقایسه قبل و بعد
                      </button>

                      <a
                        href={generation.resultUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        title="دانلود تصویر"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson-light)]"
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Compare modal */}
      {compareGeneration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">
                مقایسه قبل و بعد
              </h3>
              <button
                type="button"
                onClick={() => setCompareId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-card-warm)]"
              >
                <X size={18} />
              </button>
            </div>

            <BeforeAfterSlider
              beforeUrl={compareGeneration.originalUrl}
              afterUrl={compareGeneration.resultUrl}
            />
          </div>
        </div>
      )}
    </section>
  );
}
