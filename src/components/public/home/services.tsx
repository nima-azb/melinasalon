import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Scissors } from "lucide-react";

import { prisma } from "@/lib/prisma";

export async function Services() {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <section className="bg-[var(--bg-card)] py-20 sm:py-24" id="services">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section heading */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--brand-crimson)]">
            <span className="h-px w-6 bg-[var(--brand-crimson)]" />
            خدمات تخصصی سالن زیبایی ملین بیوتی
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            خدماتی برای
            <span className="text-[var(--brand-crimson)]"> زیبایی شما</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            از استایل و رنگ مو تا میکاپ و مراقبت تخصصی؛ خدمات سالن زیبایی ملین
            بیوتی با توجه به نیاز، سلیقه و ویژگی‌های شما ارائه می‌شوند.
          </p>
        </div>

        {/* Service cards */}
        {services.length === 0 ? (
          <p className="mt-12 text-sm text-[var(--text-secondary)]">
            در حال حاضر خدمتی برای نمایش وجود ندارد.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="group overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[0_8px_30px_rgba(36,20,23,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(36,20,23,0.09)]"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-card-warm)]">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--brand-crimson-light)]">
                      <Scissors
                        size={36}
                        className="text-[var(--brand-crimson)]/50"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">
                      {service.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {service.duration} دقیقه
                    </span>

                    <Link
                      href={`/?service=${service.id}#booking`}
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
        )}
      </div>
    </section>
  );
}
