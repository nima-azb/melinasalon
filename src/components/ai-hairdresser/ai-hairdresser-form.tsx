"use client";

import {
  Circle,
  Feather,
  ImagePlus,
  Layers,
  Leaf,
  Minus,
  Moon,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import {
  hairColors,
  hairstyles,
  makeupStyles,
  type HairColorId,
  type HairstyleId,
  type MakeupStyleId,
} from "@/lib/ai/ai-hairdresser-options";

import { BeforeAfterSlider } from "./before-after-slider";

type Workflow = "custom" | "recommendation";

type ApiResponse = {
  success: boolean;
  message?: string;
  workflowType?: Workflow;
  remainingGenerations?: number;
  retryAfterSeconds?: number;
  images?: {
    originalUrl: string;
    resultUrl: string;
  };
};

const hairstyleIcons: Record<HairstyleId, LucideIcon> = {
  "long-layered": Layers,
  "shoulder-layered": Feather,
  bob: Scissors,
  short: Zap,
  wavy: Waves,
  straight: Minus,
  curly: Sparkle,
};

const makeupIcons: Record<MakeupStyleId, LucideIcon> = {
  natural: Leaf,
  "soft-glam": Sparkles,
  evening: Moon,
  minimal: Circle,
};

function formatRetryAfter(seconds: number): string {
  const hours = Math.ceil(seconds / 3600);

  if (hours <= 1) {
    return "حدود ۱ ساعت دیگر";
  }

  return `حدود ${hours} ساعت دیگر`;
}

export function AIHairdresserForm({
  eligible,
  remainingGenerations,
}: {
  eligible: boolean;
  remainingGenerations: number;
}) {
  const [workflow, setWorkflow] = useState<Workflow>("recommendation");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const [hairColor, setHairColor] = useState<HairColorId | "">("");
  const [hairstyle, setHairstyle] = useState<HairstyleId | "">("");
  const [makeup, setMakeup] = useState<MakeupStyleId | "">("");
  const [instructions, setInstructions] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [retryHint, setRetryHint] = useState("");
  const [remaining, setRemaining] = useState(remainingGenerations);

  const [result, setResult] = useState<{
    workflow: Workflow;
    originalUrl: string;
    resultUrl: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const interactiveSectionRef = useRef<HTMLDivElement>(null);

  const canSubmit = eligible && remaining > 0;

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;

    setImage(selectedImage);
    setError("");
    setRetryHint("");

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl(selectedImage ? URL.createObjectURL(selectedImage) : "");
  }

  function handleRemoveImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImage(null);
    setImagePreviewUrl("");
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setRetryHint("");

    if (!canSubmit) {
      return;
    }

    if (!image) {
      setError("لطفاً ابتدا یک تصویر انتخاب کنید.");
      return;
    }

    if (workflow === "custom" && (!hairColor || !hairstyle || !makeup)) {
      setError("لطفاً رنگ مو، مدل مو و سبک میکاپ را انتخاب کنید.");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("image", image);
      formData.append("mode", workflow);

      if (workflow === "custom") {
        formData.append("hairColor", hairColor);
        formData.append("hairstyle", hairstyle);
        formData.append("makeup", makeup);

        if (instructions.trim()) {
          formData.append("instructions", instructions.trim());
        }
      }

      const response = await fetch("/api/ai-hairdresser", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const responseText = await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch {
        throw new Error("پاسخ سرور نامعتبر بود.");
      }

      if (response.status === 429) {
        setRemaining(0);

        if (typeof data.retryAfterSeconds === "number") {
          setRetryHint(formatRetryAfter(data.retryAfterSeconds));
        }

        throw new Error(
          data.message || "شما به سقف مجاز درخواست‌های هوش مصنوعی رسیده‌اید.",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ساخت تصویر با خطا مواجه شد.");
      }

      if (!data.images?.resultUrl) {
        throw new Error("تصویر ساخته شد اما نمایش آن با خطا مواجه شد.");
      }

      setResult({
        workflow,
        originalUrl: data.images.originalUrl,
        resultUrl: data.images.resultUrl,
      });

      if (typeof data.remainingGenerations === "number") {
        setRemaining(data.remainingGenerations);
      }
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        // Cancelled by the user — no error message needed.
      } else {
        console.error("AI Hairdresser request failed:", requestError);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "مشکلی در ساخت تصویر پیش آمد.",
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsSubmitting(false);
    }
  }

  function handleTryAnotherStyle() {
    setResult(null);
    interactiveSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div>
      {/* Remaining generations pill */}
      <div className="mt-6 flex justify-center">
        <span
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
            remaining > 0
              ? "border-[var(--brand-crimson)]/20 bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {remaining} از ۳ درخواست باقی‌مانده در ۲۴ ساعت اخیر
        </span>
      </div>

      {!eligible ? (
        <section className="mx-auto mt-10 max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-crimson-light)]">
            <Scissors size={28} className="text-[var(--brand-crimson)]" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
            این بخش فقط برای مشتریان با نوبت تایید‌شده است
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
            برای استفاده از آرایشگر هوش مصنوعی، ابتدا باید یک نوبت رزرو کرده و
            تایید آن را دریافت کنید.
          </p>

          <Link
            href="/#booking"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--brand-crimson)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
          >
            رزرو نوبت
          </Link>
        </section>
      ) : (
        <div ref={interactiveSectionRef} className="mt-10">
          <form
            onSubmit={handleSubmit}
            className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12"
          >
            {/* Upload column */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <label
                htmlFor="ai-hairdresser-image"
                className={`relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 p-8 text-center shadow-sm transition-all ${
                  imagePreviewUrl
                    ? "border-solid border-[var(--brand-crimson)]/30 p-0"
                    : "border-dashed border-[var(--border-beige)] bg-[var(--bg-card)] hover:border-[var(--brand-crimson)]/50 hover:bg-[var(--bg-card-warm)]"
                }`}
              >
                {imagePreviewUrl ? (
                  <>
                    <Image
                      src={imagePreviewUrl}
                      alt="پیش‌نمایش تصویر انتخابی"
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/90 p-3 shadow-md backdrop-blur-md">
                      <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                        {image?.name}
                      </span>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          handleRemoveImage();
                        }}
                        title="حذف تصویر"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-crimson-light)]">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--brand-crimson)]/10" />
                      <ImagePlus
                        size={34}
                        className="relative z-10 text-[var(--brand-crimson)]"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">
                        عکس خود را بارگذاری کنید
                      </h3>

                      <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                        برای بهترین نتیجه، عکسی از روبرو با نور مناسب، بدون عینک
                        و با موهای بسته‌شده انتخاب کنید.
                      </p>
                    </div>

                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-beige)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-crimson)] shadow-sm">
                      <Upload size={16} />
                      انتخاب تصویر
                    </span>
                  </div>
                )}

                <input
                  id="ai-hairdresser-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="sr-only"
                />
              </label>

              <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-sm">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[var(--brand-crimson)]"
                />

                <p className="text-xs leading-6 text-[var(--text-secondary)]">
                  تصاویر شما کاملاً محرمانه است و بلافاصله پس از پردازش از
                  سرورهای ما حذف می‌شود. حریم خصوصی شما اولویت ماست.
                </p>
              </div>
            </div>

            {/* Style selection column */}
            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                <div className="mb-6 flex items-end justify-between border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    انتخاب استایل
                  </h2>

                  <span className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
                    مرحله ۲
                  </span>
                </div>

                {/* Workflow toggle */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkflow("custom")}
                    disabled={isSubmitting}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      workflow === "custom"
                        ? "border-[var(--brand-crimson)] bg-[var(--bg-card-warm)] shadow-md"
                        : "border-transparent bg-[var(--bg-card)] shadow-sm hover:shadow-md"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                      <Palette size={20} />
                    </span>

                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      انتخاب دلخواه من
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkflow("recommendation")}
                    disabled={isSubmitting}
                    className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border-2 bg-gradient-to-br from-[var(--brand-crimson-light)] to-[var(--bg-card-warm)] p-4 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      workflow === "recommendation"
                        ? "border-[var(--brand-crimson)] shadow-md"
                        : "border-transparent shadow-sm hover:shadow-md"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-crimson)] text-white shadow-sm">
                      <WandSparkles size={20} />
                    </span>

                    <span className="text-sm font-bold text-[var(--brand-crimson)]">
                      پیشنهاد هوشمند
                    </span>

                    <span className="text-[10px] text-[var(--brand-crimson)]/70">
                      تحلیل فرم صورت شما
                    </span>
                  </button>
                </div>

                {workflow === "recommendation" ? (
                  <div className="rounded-2xl bg-[var(--bg-card-warm)] p-5">
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      هوش مصنوعی ویژگی‌های ظاهری، تناسب صورت و رنگ پوست شما را
                      تحلیل کرده و دو ظاهر متفاوت و متناسب با شما می‌سازد؛ هر دو
                      در یک تصویر و با مصرف تنها یک سهمیه درخواست.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Hair color */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        رنگ مو
                      </h3>

                      <div className="grid grid-cols-4 gap-2.5">
                        {hairColors.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setHairColor(option.id)}
                            disabled={isSubmitting}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                              hairColor === option.id
                                ? "border-[var(--brand-crimson)] bg-[var(--bg-card-warm)]"
                                : "border-transparent bg-[var(--bg-card)] shadow-sm hover:shadow-md"
                            }`}
                          >
                            <span
                              className="h-7 w-7 rounded-full border border-black/10 shadow-inner"
                              style={{ backgroundColor: option.swatch }}
                            />

                            <span className="text-[11px] leading-tight font-medium text-[var(--text-primary)]">
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hairstyle */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        مدل مو
                      </h3>

                      <div className="grid grid-cols-4 gap-2.5">
                        {hairstyles.map((option) => {
                          const Icon = hairstyleIcons[option.id];

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setHairstyle(option.id)}
                              disabled={isSubmitting}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                hairstyle === option.id
                                  ? "border-[var(--brand-crimson)] bg-[var(--bg-card-warm)]"
                                  : "border-transparent bg-[var(--bg-card)] shadow-sm hover:shadow-md"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                  hairstyle === option.id
                                    ? "bg-[var(--brand-crimson)] text-white"
                                    : "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                                }`}
                              >
                                <Icon size={16} />
                              </span>

                              <span className="text-[11px] leading-tight font-medium text-[var(--text-primary)]">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Makeup */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        میکاپ
                      </h3>

                      <div className="grid grid-cols-4 gap-2.5">
                        {makeupStyles.map((option) => {
                          const Icon = makeupIcons[option.id];

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setMakeup(option.id)}
                              disabled={isSubmitting}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                makeup === option.id
                                  ? "border-[var(--brand-crimson)] bg-[var(--bg-card-warm)]"
                                  : "border-transparent bg-[var(--bg-card)] shadow-sm hover:shadow-md"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                  makeup === option.id
                                    ? "bg-[var(--brand-crimson)] text-white"
                                    : "bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]"
                                }`}
                              >
                                <Icon size={16} />
                              </span>

                              <span className="text-[11px] leading-tight font-medium text-[var(--text-primary)]">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Additional instructions */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                        توضیحات تکمیلی (اختیاری)
                      </h3>

                      <textarea
                        value={instructions}
                        onChange={(event) =>
                          setInstructions(event.target.value)
                        }
                        rows={3}
                        maxLength={1000}
                        disabled={isSubmitting}
                        placeholder="مثلاً: چهره من طبیعی بماند و نتیجه واقعی به نظر برسد."
                        className="w-full rounded-xl border border-[var(--border-beige)] bg-[var(--bg-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-crimson)] disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rate limit reached */}
              {!canSubmit && (
                <div className="mt-6 rounded-xl bg-[var(--bg-card-warm)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  شما به سقف مجاز ۳ درخواست در ۲۴ ساعت رسیده‌اید. لطفاً بعداً
                  دوباره تلاش کنید.
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                  {retryHint && (
                    <span className="mt-1 block text-xs text-red-600">
                      زمان تقریبی امکان درخواست بعدی: {retryHint}
                    </span>
                  )}
                </div>
              )}

              {/* Action row */}
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5 sm:flex-row">
                <p className="flex-1 text-sm leading-6 text-[var(--text-secondary)]">
                  با انتخاب{" "}
                  <span className="font-bold text-[var(--brand-crimson)]">
                    پیشنهاد هوشمند
                  </span>
                  ، هوش مصنوعی ما با توجه به رنگ پوست و فرم صورت شما، بهترین
                  استایل را پیشنهاد می‌دهد.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-crimson)] px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--brand-crimson-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <WandSparkles size={18} />
                  {isSubmitting
                    ? "در حال ساخت..."
                    : workflow === "recommendation"
                      ? "دو پیشنهاد برای من بساز"
                      : "ظاهر من را بساز"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-cream)]/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
            <div className="relative mx-auto mb-6 h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--brand-crimson)]/15" />

              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--brand-crimson)]" />

              <div className="absolute inset-0 flex items-center justify-center">
                <WandSparkles
                  size={28}
                  className="animate-pulse text-[var(--brand-crimson)]"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-[var(--brand-crimson)]">
              در حال تحلیل چهره...
            </h3>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              هوش مصنوعی ملینا در حال بررسی فرم صورت و رنگ پوست شماست تا بهترین
              استایل را خلق کند.
            </p>

            <div className="mt-6 h-1 w-full animate-pulse overflow-hidden rounded-full bg-[var(--bg-card-warm)]">
              <div className="h-full w-1/3 rounded-full bg-[var(--brand-crimson)]" />
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="mt-6 text-xs font-medium text-[var(--text-secondary)] underline decoration-dotted underline-offset-4 transition-colors hover:text-red-600"
            >
              لغو عملیات
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <section className="mx-auto mt-16 max-w-6xl border-t border-[var(--border-subtle)] pt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--brand-crimson)]">
              نتیجه جادوی ملینا
            </h2>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {result.workflow === "recommendation"
                ? "دو پیشنهاد شخصی‌سازی‌شده شما در یک تصویر ساخته شد."
                : "استایل جدید شما آماده است."}
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-14">
            <BeforeAfterSlider
              beforeUrl={result.originalUrl}
              afterUrl={result.resultUrl}
            />

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                  <Sparkles size={18} className="text-[var(--brand-crimson)]" />
                  ظاهر جدید شما
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {result.workflow === "recommendation"
                    ? "این پیشنهاد بر اساس تحلیل هوش مصنوعی از فرم صورت و رنگ پوست شما ساخته شده است. برای دیدن پیشنهاد دیگر، دوباره امتحان کنید."
                    : "این تصویر بر اساس رنگ مو، مدل مو و سبک میکاپی که انتخاب کردید ساخته شده است."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/#booking"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-crimson)] px-6 py-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-crimson-hover)]"
                >
                  رزرو نوبت برای این استایل
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={result.resultUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full border border-[var(--border-beige)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--brand-crimson)] shadow-sm transition-colors hover:bg-[var(--bg-card-warm)]"
                  >
                    ذخیره تصویر
                  </a>

                  <button
                    type="button"
                    onClick={handleTryAnotherStyle}
                    className="flex items-center justify-center gap-2 rounded-full border border-[var(--border-beige)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-card-warm)]"
                  >
                    امتحان استایل دیگر
                  </button>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="text-center text-xs text-[var(--text-secondary)] underline decoration-dotted underline-offset-4 hover:text-[var(--brand-crimson)]"
              >
                این نتیجه در داشبورد شما هم قابل مشاهده است
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
