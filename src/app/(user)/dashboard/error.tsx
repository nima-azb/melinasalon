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
      title="خطا در بارگذاری داشبورد"
      description="بارگذاری اطلاعات داشبورد شما با خطا مواجه شد. لطفاً دوباره تلاش کنید."
    />
  );
}
