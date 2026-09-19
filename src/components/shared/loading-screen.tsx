export function LoadingScreen({
  message = "در حال بارگذاری...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-[var(--bg-cream)] px-6 py-24">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--brand-crimson)]/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--brand-crimson)]" />
      </div>

      <p className="text-sm font-medium text-[var(--text-secondary)]">
        {message}
      </p>
    </div>
  );
}
