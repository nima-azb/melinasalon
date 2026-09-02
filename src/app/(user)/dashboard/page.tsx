import { LogoutButton } from "@/components/auth/logout-button";
import { MyBookings } from "@/components/user/my-bookings";
import { requireUser } from "@/lib/auth/require-user";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-[var(--bg-cream)] p-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            پنل کاربری
          </h1>

          <p className="mt-4 text-[var(--text-secondary)]">خوش آمدید</p>

          <div className="mt-8 rounded-xl bg-[var(--bg-card-warm)] p-5">
            <p className="text-sm text-[var(--text-secondary)]">شماره موبایل</p>

            <p className="mt-2 font-medium text-[var(--text-primary)]">
              {user.phoneNumber}
            </p>

            <LogoutButton />
          </div>

          <MyBookings />
        </div>
      </div>
    </main>
  );
}
