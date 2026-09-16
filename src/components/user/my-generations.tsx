"use client";

import Image from "next/image";

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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatStyleValue(value: string | undefined) {
  if (!value) {
    return "انتخاب نشده";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]"
          aria-hidden="true"
        >
          <path d="M12 3l1.2 4.3L17.5 9l-4.3 1.7L12 15l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" />
        </svg>
        پیشنهاد هوش مصنوعی
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[var(--bg-card-warm)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
      انتخاب شخصی
    </span>
  );
}

export function MyGenerations({ generations }: MyGenerationsProps) {
  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-medium text-[var(--brand-crimson)]">
          گالری شخصی شما
        </p>

        <h2 className="mt-1 text-2xl font-bold">تصاویر هوش مصنوعی</h2>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          نتیجه تجربه‌های شما با آرایشگر هوش مصنوعی در اینجا ذخیره می‌شود.
        </p>
      </div>

      {generations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-beige)] bg-[var(--bg-card-warm)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 fill-none stroke-current stroke-[1.7]"
              aria-hidden="true"
            >
              <path d="M12 3l1.2 4.3L17.5 9l-4.3 1.7L12 15l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" />
              <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
            </svg>
          </div>

          <p className="mt-4 font-semibold">هنوز تصویری تولید نکرده‌اید</p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            بعد از داشتن نوبت تأییدشده، می‌توانید از آرایشگر هوش مصنوعی استفاده
            کنید و نتایج خود را اینجا ببینید.
          </p>

          <a
            href="/ai-hairdresser"
            className="mt-5 inline-flex rounded-xl bg-[var(--brand-crimson)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-crimson-hover)]"
          >
            آرایشگر هوش مصنوعی
          </a>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {generations.map((generation) => {
            const styles = parseStyles(generation.styleChosen);
            const isRecommendation =
              generation.workflowType === "RECOMMENDATION";

            return (
              <article
                key={generation.id}
                className="overflow-hidden rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              >
                {/* Images */}
                <div
                  className={`grid gap-px bg-[var(--border-subtle)] ${
                    isRecommendation ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  <div className="bg-[var(--bg-card)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--text-secondary)]">
                        تصویر اصلی
                      </p>
                    </div>

                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--bg-card-warm)]">
                      <Image
                        src={generation.originalUrl}
                        alt="تصویر اصلی"
                        fill
                        sizes="(max-width: 1280px) 50vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {isRecommendation ? (
                    <div className="bg-[var(--bg-card)] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--brand-crimson)]">
                          دو پیشنهاد شخصی‌سازی‌شده
                        </p>
                      </div>

                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[var(--bg-card-warm)]">
                        <Image
                          src={generation.resultUrl}
                          alt="دو پیشنهاد شخصی‌سازی‌شده آرایشگر هوش مصنوعی"
                          fill
                          sizes="(max-width: 1280px) 100vw, 700px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-card)] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--brand-crimson)]">
                          نتیجه هوش مصنوعی
                        </p>
                      </div>

                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--bg-card-warm)]">
                        <Image
                          src={generation.resultUrl}
                          alt="نتیجه آرایشگر هوش مصنوعی"
                          fill
                          sizes="(max-width: 1280px) 50vw, 400px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="border-t border-[var(--border-subtle)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        تاریخ تولید
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(generation.createdAt)}
                      </p>
                    </div>

                    <WorkflowBadge workflowType={generation.workflowType} />
                  </div>

                  {isRecommendation ? (
                    <div className="mt-5 rounded-2xl bg-[var(--bg-card-warm)] p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
                            aria-hidden="true"
                          >
                            <path d="M12 3l1.2 4.3L17.5 9l-4.3 1.7L12 15l-1.2-4.3L6.5 9l4.3-1.7L12 3Z" />
                          </svg>
                        </span>

                        <div>
                          <p className="text-sm font-bold">
                            پیشنهادهای متناسب با چهره شما
                          </p>

                          <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                            هوش مصنوعی ویژگی‌های قابل مشاهده چهره شما را بررسی
                            کرده و دو ظاهر متفاوت را در یک تصویر پیشنهاد داده
                            است.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-[var(--bg-card-warm)] p-3.5">
                          <p className="text-xs text-[var(--text-secondary)]">
                            رنگ مو
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatStyleValue(styles.hairColor)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-card-warm)] p-3.5">
                          <p className="text-xs text-[var(--text-secondary)]">
                            مدل مو
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatStyleValue(styles.hairstyle)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-card-warm)] p-3.5">
                          <p className="text-xs text-[var(--text-secondary)]">
                            آرایش
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatStyleValue(styles.makeup)}
                          </p>
                        </div>
                      </div>

                      {styles.instructions && (
                        <div className="mt-3 rounded-xl bg-[var(--bg-card-warm)] p-4">
                          <p className="text-xs text-[var(--text-secondary)]">
                            توضیحات شما
                          </p>

                          <p className="mt-1 text-sm leading-6">
                            {styles.instructions}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
