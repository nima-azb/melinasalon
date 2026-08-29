import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock3, ArrowUp } from "lucide-react";

const navigation = [
  { title: "خانه", href: "/" },
  { title: "خدمات", href: "#services" },
  { title: "آرایشگر هوش مصنوعی", href: "#ai-hairdresser" },
  { title: "نمونه کارها", href: "#gallery" },
  { title: "رزرو نوبت", href: "#booking" },
];

const services = ["مو و استایل", "رنگ و لایت", "میکاپ", "مراقبت و احیای مو"];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-warm)]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                <Image
                  src="/images/logo1.png"
                  alt="لوگوی سالن زیبایی ملینا"
                  fill
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-lg font-bold text-[var(--brand-crimson)]">
                  ملینا
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  سالن زیبایی
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">
              تجربه‌ای متفاوت از زیبایی، با ترکیبی از تخصص، ظرافت و فناوری
              هوشمند.
            </p>

            <Link
              href="#booking"
              className="mt-5 inline-flex items-center rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-crimson-hover)]"
            >
              رزرو نوبت
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              دسترسی سریع
            </h3>

            <ul className="mt-5 space-y-3">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              خدمات
            </h3>

            <ul className="mt-5 space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              ارتباط با ما
            </h3>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-[var(--brand-crimson)]"
                />

                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  آدرس سالن زیبایی ملینا
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Phone
                  size={17}
                  className="shrink-0 text-[var(--brand-crimson)]"
                />

                <a
                  href="tel:+989000000000"
                  className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
                  dir="ltr"
                >
                  ۰۹۰۰ ۰۰۰ ۰۰۰۰
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Clock3
                  size={17}
                  className="shrink-0 text-[var(--brand-crimson)]"
                />

                <p className="text-sm text-[var(--text-secondary)]">
                  هر روز ۱۰:۰۰ تا ۲۰:۰۰
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="اینستاگرام"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-beige)] text-[var(--text-secondary)] transition-all hover:border-[var(--brand-crimson)] hover:bg-[var(--brand-crimson)] hover:text-white"
              >
                <Image
                  src="/images/instagram.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} سالن زیبایی ملینا. تمامی حقوق محفوظ
            است.
          </p>

          <Link
            href="#"
            className="group inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-crimson)]"
          >
            بازگشت به بالا
            <ArrowUp
              size={14}
              className="transition-transform group-hover:-translate-y-1"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
