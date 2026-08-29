import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, WandSparkles } from "lucide-react";

export function AIHairdresser() {
  return (
    <section
      className="overflow-hidden bg-[var(--bg-card)] py-20 sm:py-24 lg:py-28"
      id="ai-hairdresser"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Visual */}
          <div className="relative mx-auto w-full max-w-xl">
            {/* Decorative elements */}
            <div className="absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[var(--brand-crimson-light)] blur-3xl" />

            <div className="absolute -left-4 top-8 z-20 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-xs font-medium text-[var(--text-primary)] shadow-lg backdrop-blur-md">
              <Sparkles size={14} className="text-[var(--accent-gold)]" />
              تجربه هوشمند زیبایی
            </div>

            {/* Image comparison */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] p-2 shadow-[0_20px_60px_rgba(36,20,23,0.10)]">
              <div className="relative h-full overflow-hidden rounded-[1.5rem]">
                {/* Before */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/ai/ai-before.jpg"
                    alt="نمونه قبل از تغییر استایل مو"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                {/* AI result */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: "inset(0 0 0 50%)" }}
                >
                  <Image
                    src="/images/ai/ai-after.jpg"
                    alt="نمونه استایل پیشنهادی آرایشگر هوش مصنوعی"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[var(--brand-crimson)]/10" />
                </div>

                {/* Comparison divider */}
                <div className="absolute inset-y-0 right-1/2 z-10 w-px bg-white">
                  <div className="absolute right-1/2 top-1/2 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--brand-crimson)] text-white shadow-lg">
                    <WandSparkles size={17} />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-10 left-5 rounded-full bg-black/45 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  قبل
                </div>

                <div className="absolute bottom-10 right-5 rounded-full bg-[var(--brand-crimson)] px-3 py-1.5 text-[10px] font-medium text-white shadow-sm">
                  پیشنهاد هوش مصنوعی
                </div>
              </div>
            </div>

            {/* Floating status card */}
            <div className="absolute -bottom-5 -right-4 z-20 rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 shadow-[0_12px_35px_rgba(36,20,23,0.10)] sm:-right-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <Sparkles size={16} />
                </div>

                <div>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    پیشنهاد آماده است
                  </p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    متناسب با چهره شما
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium text-[var(--brand-crimson)]">
              <WandSparkles size={14} />
              فناوری در خدمت زیبایی
            </div>

            <h2 className="max-w-xl text-3xl font-bold leading-[1.45] tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              قبل از تغییر،
              <span className="text-[var(--brand-crimson)]"> ببینید</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-8 text-[var(--text-secondary)] sm:text-base">
              با آرایشگر هوش مصنوعی ملینا، قبل از انتخاب استایل جدید می‌توانید
              ظاهر پیشنهادی خود را تصور کنید و با اطمینان بیشتری برای تغییر
              آماده شوید.
            </p>

            {/* Benefits */}
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <Check size={14} strokeWidth={2.5} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    پیشنهاد متناسب با ویژگی‌های شما
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                    استایل‌ها را با توجه به چهره و انتخاب شما بررسی کنید.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <Check size={14} strokeWidth={2.5} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    تجربه استایل قبل از مراجعه
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                    قبل از رزرو خدمت، ایده‌ای از نتیجه احتمالی داشته باشید.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                  <Check size={14} strokeWidth={2.5} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    انتخاب آگاهانه‌تر
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                    ایده خود را با متخصص سالن در میان بگذارید و بهترین گزینه را
                    انتخاب کنید.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/ai-hairdresser"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(143,24,51,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-crimson-hover)]"
              >
                امتحان آرایشگر هوش مصنوعی
                <ArrowLeft
                  size={16}
                  className="transition-transform group-hover:-translate-x-1"
                />
              </Link>
            </div>

            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              ✦ این ابزار برای پیشنهاد و پیش‌نمایش استایل طراحی شده است.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
