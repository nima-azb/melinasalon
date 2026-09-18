"use client";

import { MoveHorizontal } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "قبل",
  afterLabel = "بعد",
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  function updateFromClientX(clientX: number) {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;

    setPercent(Math.min(100, Math.max(0, ratio)));
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-xl"
      onPointerDown={(event) => {
        setIsDragging(true);
        updateFromClientX(event.clientX);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (isDragging) {
          updateFromClientX(event.clientX);
        }
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => setIsDragging(false)}
    >
      {/* After image (full, bottom layer) */}
      <Image
        src={afterUrl}
        alt={afterLabel}
        fill
        unoptimized
        className="pointer-events-none object-cover"
      />

      <span className="pointer-events-none absolute top-4 right-4 rounded-full bg-[var(--brand-crimson)] px-3 py-1 text-xs font-semibold text-white shadow-md">
        {afterLabel}
      </span>

      {/* Before image (clipped to slider position) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
      >
        <Image
          src={beforeUrl}
          alt={beforeLabel}
          fill
          unoptimized
          className="object-cover"
        />

        <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-md">
          {beforeLabel}
        </span>
      </div>

      {/* Slider handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.25)]"
        style={{ left: `${percent}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white shadow-lg">
          <MoveHorizontal size={16} className="text-[var(--brand-crimson)]" />
        </div>
      </div>
    </div>
  );
}
