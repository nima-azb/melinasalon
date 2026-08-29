import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="overflow-hidden bg-[var(--bg-cream)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* Image side */}
          <div className="relative mx-auto w-full max-w-xl lg:order-1">
            {/* Decorative background */}
            <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-[var(--brand-crimson-light)] blur-2xl" />

            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full border border-[var(--accent-gold)]/30" />

            {/* Main image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-[0_20px_60px_rgba(36,20,23,0.10)]">
              <div className="relative h-full overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/hero.webp"
                  alt="سالن زیبایی ملینا"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />

                {/* Image overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-6 pt-24">
                  <div className="flex items-end justify-between gap-4 text-white">
                    <div>
                      <p className="text-xs text-white/75">تجربه‌ای برای شما</p>
                      <p className="mt-1 text-lg font-semibold">
                        زیبایی با ظرافت
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating AI badge */}
            <div className="absolute -right-3 top-8 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 shadow-[0_12px_35px_rgba(36,20,23,0.10)] sm:-right-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  دستیار هوشمند زیبایی
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                  آرایشگر هوش مصنوعی
                </p>
              </div>
            </div>
          </div>

          {/* Content side */}
          <div className="lg:order-2">
            {/* Eyebrow */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium text-[var(--brand-crimson)]">
              <Sparkles size={14} />
              زیبایی، تخصص و تجربه در کنار هم
            </div>

            {/* Heading */}
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.35] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              زیبایی،
              <span className="text-[var(--brand-crimson)]"> به سبک شما</span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
              در سالن زیبایی ملینا، زیبایی شما با تجربه حرفه‌ای، خدمات تخصصی و
              نگاهی مدرن به دنیای زیبایی همراه می‌شود. سبک مورد علاقه‌تان را
              پیدا کنید و نوبت خود را به آسانی رزرو کنید.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-crimson)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(143,24,51,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-crimson-hover)]"
              >
                <CalendarDays size={18} />
                رزرو نوبت
              </Link>

              <Link
                href="/ai-hairdresser"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-beige)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-crimson)] hover:text-[var(--brand-crimson)]"
              >
                <Sparkles size={18} />
                امتحان آرایشگر هوش مصنوعی
                <ArrowLeft size={15} />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-[var(--border-subtle)]"></div>

            {/* Small trust message */}
            <p className="mt-5 text-xs text-[var(--text-secondary)]">
              ✦ خدمات تخصصی مو، رنگ، مراقبت و زیبایی با توجه به سلیقه شما
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
