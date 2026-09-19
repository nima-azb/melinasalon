import { SearchX } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/public/footer";
import { Navbar } from "@/components/public/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-[65vh] w-full flex-col items-center justify-center gap-5 bg-[var(--bg-cream)] px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-crimson-light)] text-[var(--brand-crimson)]">
          <SearchX size={28} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            صفحه مورد نظر پیدا نشد
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
            آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 rounded-full bg-[var(--brand-crimson)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-crimson-hover)]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </main>

      <Footer />
    </>
  );
}
