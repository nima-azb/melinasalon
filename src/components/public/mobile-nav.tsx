"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navigationItems = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/services", label: "خدمات" },
  { href: "/ai-hairdresser", label: "آرایشگر هوش مصنوعی", isNew: true },
  { href: "/about", label: "درباره ما" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "بستن منو" : "باز کردن منو"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-beige)] bg-white text-[var(--brand-crimson)] transition-colors hover:bg-[var(--brand-crimson-light)]"
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg">
          <nav className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex flex-col">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-[var(--border-subtle)] py-4 text-sm font-medium text-[var(--text-primary)] transition-colors last:border-b-0 hover:text-[var(--brand-crimson)]"
                >
                  <span>{item.label}</span>

                  {item.isNew && (
                    <span className="rounded-full bg-[var(--brand-crimson)] px-2 py-0.5 text-[10px] text-white">
                      جدید
                    </span>
                  )}
                </Link>
              ))}

              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="mt-4 rounded-xl border border-[var(--border-beige)] bg-[var(--bg-card-warm)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
              >
                حساب کاربری
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
