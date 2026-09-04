import { AIHairdresserForm } from "@/components/ai-hairdresser/ai-hairdresser-form";

export default function AIHairdresserPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-cream)] p-6 sm:p-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          آرایشگر هوش مصنوعی
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          ظاهر جدید مو و میکاپ خود را با هوش مصنوعی امتحان کنید.
        </p>

        <AIHairdresserForm />
      </div>
    </main>
  );
}
