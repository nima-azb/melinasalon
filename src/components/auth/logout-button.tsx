"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({
  className = "",
  redirectTo = "/login",
}: {
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`rounded-xl bg-[var(--brand-crimson)] px-5 py-3 text-sm font-bold text-white ${className}`}
    >
      خروج از حساب
    </button>
  );
}
