import { CalendarCheck, Heart, Sparkles, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";

const reasons = [
  {
    icon: Award,
    number: "۰۱",
    title: "تخصص و تجربه",
    description:
      "خدمات زیبایی با تکیه بر تجربه، دانش تخصصی و توجه به جزئیات ارائه می‌شوند.",
  },
  {
    icon: CalendarCheck,
    number: "۰۲",
    title: "رزرو آنلاین هوشمند",
    description:
      "خدمت موردنظر و زمان مناسب خود را به‌سادگی انتخاب کنید و نوبتتان را رزرو کنید.",
  },
  {
    icon: Heart,
    number: "۰۳",
    title: "تجربه شخصی‌سازی‌شده",
    description:
      "هدف ما ارائه تجربه‌ای متناسب با ویژگی‌ها، نیازها و سلیقه شخصی شماست.",
  },
  {
    icon: Sparkles,
    number: "۰۴",
    title: "فناوری در خدمت زیبایی",
    description:
      "با استفاده از ابزارهای هوشمند، انتخاب و تجربه خدمات زیبایی را ساده‌تر می‌کنیم.",
  },
];

export function WhyMelina() {
  return (
    <section className="bg-[var(--bg-cream)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium text-[var(--brand-crimson)]">
            <Sparkles size={14} />
            تجربه‌ای متفاوت از زیبایی
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            چرا
            <span className="text-[var(--brand-crimson)]">
              {" "}
              سالن زیبایی ملینا؟
            </span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            ما زیبایی را فقط به نتیجه نهایی محدود نمی‌کنیم؛ از اولین انتخاب تا
            پایان تجربه، تلاش می‌کنیم همه‌چیز ساده، حرفه‌ای و متناسب با شما
            باشد.
          </p>
        </div>

        {/* Reasons */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => {
            const Icon = reason.icon;

            return (
              <article
                key={reason.number}
                className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-crimson)]/20 hover:shadow-[0_16px_40px_rgba(36,20,23,0.07)]"
              >
                {/* Number */}
                <span className="absolute left-5 top-5 text-[10px] font-medium tracking-wider text-[var(--text-secondary)]/50">
                  {reason.number}
                </span>

                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)] transition-colors duration-300 group-hover:bg-[var(--brand-crimson)] group-hover:text-white">
                  <Icon size={20} />
                </div>

                <h3 className="mt-6 text-base font-bold text-[var(--text-primary)]">
                  {reason.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {reason.description}
                </p>

                {/* Bottom accent */}
                <div className="mt-6 h-px w-10 bg-[var(--accent-gold)] transition-all duration-300 group-hover:w-16" />
              </article>
            );
          })}
        </div>

        {/* Small supporting CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-crimson)]"
          >
            بیشتر درباره سالن زیبایی ملینا
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
