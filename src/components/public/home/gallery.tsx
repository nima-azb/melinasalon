"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Expand, Sparkles } from "lucide-react";
import { useState } from "react";

import { galleryItems } from "./gallery-data";

const filters = ["همه", "مو", "رنگ و لایت", "میکاپ"] as const;

type Filter = (typeof filters)[number];

export function Gallery() {
  const [activeFilter, setActiveFilter] = useState<Filter>("همه");

  const filteredItems =
    activeFilter === "همه"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  return (
    <section
      className="bg-[var(--bg-card)] py-20 sm:py-24 lg:py-28"
      id="gallery"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-crimson)]/15 bg-[var(--brand-crimson-light)] px-3.5 py-2 text-xs font-medium text-[var(--brand-crimson)]">
              <Sparkles size={14} />
              نمونه کارهای سالن زیبایی ملینا
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              زیبایی را در
              <span className="text-[var(--brand-crimson)]"> جزئیات</span>{" "}
              ببینید
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              بخشی از تجربه و هنر تیم سالن زیبایی ملینا را در مجموعه‌ای از
              نمونه‌کارهای ما ببینید.
            </p>
          </div>

          <Link
            href="/gallery"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--brand-crimson)]"
          >
            مشاهده همه نمونه کارها
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[var(--brand-crimson)] text-white shadow-sm"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-card-warm)] text-[var(--text-secondary)] hover:border-[var(--brand-crimson)]/30 hover:text-[var(--brand-crimson)]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Gallery */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {filteredItems.map((item, index) => {
            const isFeatured = index === 0;
            const isWide = index === 3;

            return (
              <Link
                href={`/gallery/${item.id}`}
                key={item.id}
                className={`group relative overflow-hidden rounded-2xl bg-[var(--bg-card-warm)] ${
                  isFeatured
                    ? "col-span-2 row-span-2 aspect-square"
                    : isWide
                      ? "col-span-2 aspect-[2/1]"
                      : "aspect-square"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes={
                    isFeatured || isWide
                      ? "(max-width: 640px) 100vw, 50vw"
                      : "(max-width: 640px) 50vw, 25vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-medium text-white backdrop-blur-md">
                        {item.category}
                      </span>

                      <h3 className="mt-2 text-sm font-semibold text-white sm:text-base">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-[var(--brand-crimson)]">
                      <Expand size={15} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
