"use client";

import Image from "next/image";

type Generation = {
  id: string;
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
    };
  } catch {
    return {};
  }
}

export function MyGenerations({ generations }: MyGenerationsProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          تصاویر آرایشگر هوش مصنوعی
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          تصاویر تولیدشده برای شما
        </p>
      </div>

      {generations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            هنوز تصویری با آرایشگر هوش مصنوعی تولید نکرده‌اید.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {generations.map((generation) => {
            const styles = parseStyles(generation.styleChosen);

            return (
              <article
                key={generation.id}
                className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              >
                <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)]">
                  <div className="bg-[var(--bg-card)]">
                    <div className="p-3">
                      <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                        تصویر اصلی
                      </p>

                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--bg-card-warm)]">
                        <Image
                          src={generation.originalUrl}
                          alt="تصویر اصلی"
                          fill
                          sizes="(max-width: 768px) 50vw, 300px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)]">
                    <div className="p-3">
                      <p className="mb-2 text-xs font-medium text-[var(--brand-crimson)]">
                        نتیجه هوش مصنوعی
                      </p>

                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--bg-card-warm)]">
                        <Image
                          src={generation.resultUrl}
                          alt="نتیجه آرایشگر هوش مصنوعی"
                          fill
                          sizes="(max-width: 768px) 50vw, 300px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--border-subtle)] p-5">
                  <div className="mb-4">
                    <p className="text-xs text-[var(--text-secondary)]">
                      تاریخ تولید
                    </p>

                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      {formatDate(generation.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[var(--bg-card-warm)] p-3">
                      <p className="text-xs text-[var(--text-secondary)]">
                        رنگ مو
                      </p>

                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                        {formatStyleValue(styles.hairColor)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-card-warm)] p-3">
                      <p className="text-xs text-[var(--text-secondary)]">
                        مدل مو
                      </p>

                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                        {formatStyleValue(styles.hairstyle)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-card-warm)] p-3">
                      <p className="text-xs text-[var(--text-secondary)]">
                        آرایش
                      </p>

                      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                        {formatStyleValue(styles.makeup)}
                      </p>
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
