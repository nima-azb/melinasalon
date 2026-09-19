"use client";

import { ErrorScreen } from "@/components/shared/error-screen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      title="خطا در بارگذاری پنل مدیریت"
      description="بارگذاری پنل مدیریت با خطا مواجه شد. لطفاً دوباره تلاش کنید."
    />
  );
}
