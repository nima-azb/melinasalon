import { ServiceManagement } from "@/components/admin/service-management";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-cream)] p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          پنل مدیریت
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          مدیریت خدمات سالن
        </p>

        <ServiceManagement />
      </div>
    </main>
  );
}
