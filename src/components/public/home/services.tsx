import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { services } from "./services-data";

export function Services() {
  return (
    <section className="bg-[var(--bg-card)] py-20 sm:py-24" id="services">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section heading */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--brand-crimson)]">
              <span className="h-px w-6 bg-[var(--brand-crimson)]" />
              خدمات تخصصی سالن زیبایی ملینا
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              خدماتی برای
              <span className="text-[var(--brand-crimson)]"> زیبایی شما</span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              از استایل و رنگ مو تا میکاپ و مراقبت تخصصی؛ خدمات سالن زیبایی
              ملینا با توجه به نیاز، سلیقه و ویژگی‌های شما ارائه می‌شوند.
            </p>
          </div>

          <Link
            href="/services"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--brand-crimson)]"
          >
            مشاهده همه خدمات
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
          </Link>
        </div>

        {/* Service cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="group overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_30px_rgba(36,20,23,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(36,20,23,0.09)]"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-card-warm)]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[var(--brand-crimson)] shadow-sm backdrop-blur-sm">
                  {service.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {service.title}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">
                  {service.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      قیمت
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--brand-crimson)]">
                      {service.price}
                    </p>
                  </div>

                  <Link
                    href={`/booking?service=${service.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson)] hover:text-white"
                  >
                    <CalendarDays size={14} />
                    رزرو خدمت
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
