export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold text-[var(--brand-crimson)]">
              سالن زیبایی ملینا
            </p>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              زیبایی، به سبک شما
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-[var(--text-secondary)]">
            <span>رزرو نوبت</span>
            <span>آرایشگر هوش مصنوعی</span>
            <span>خدمات</span>
            <span>تماس با ما</span>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 text-sm text-[var(--text-secondary)]">
          © تمامی حقوق برای سالن زیبایی ملینا محفوظ است.
        </div>
      </div>
    </footer>
  );
}
