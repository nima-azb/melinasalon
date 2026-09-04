"use client";

import { useEffect, useState } from "react";

type Generation = {
  id: string;
  userId: string;
  originalPhotoUrl: string;
  resultPhotoUrl: string;
  styleChosen: string | null;
  createdAt: string;
  user: {
    id: string;
    phoneNumber: string;
  };
};

type GenerationWithImages = Generation & {
  originalUrl: string;
  resultUrl: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("fa-IR");
}

function parseStyle(styleChosen: string | null) {
  if (!styleChosen) {
    return null;
  }

  try {
    return JSON.parse(styleChosen) as {
      hairColor?: string;
      hairstyle?: string;
      makeup?: string;
    };
  } catch {
    return null;
  }
}

export function GenerationManagement() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [images, setImages] = useState<Record<string, GenerationWithImages>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGenerations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/generations", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load generations.");
        }

        setGenerations(data.generations);
      } catch (error) {
        console.error("Failed to load generations:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load generations.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadGenerations();
  }, []);

  async function loadImages(generation: Generation) {
    if (images[generation.id] || imageLoading[generation.id]) {
      return;
    }

    try {
      setImageLoading((current) => ({
        ...current,
        [generation.id]: true,
      }));

      const response = await fetch(
        `/api/admin/generations/${generation.id}/images`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load generation images.");
      }

      setImages((current) => ({
        ...current,
        [generation.id]: {
          ...generation,
          originalUrl: data.originalUrl,
          resultUrl: data.resultUrl,
        },
      }));
    } catch (error) {
      console.error("Failed to load generation images:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load generation images.",
      );
    } finally {
      setImageLoading((current) => ({
        ...current,
        [generation.id]: false,
      }));
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          AI Hairdresser Generations
        </h2>

        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading generations...
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            AI Hairdresser Generations
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Review AI hairstyle generations created by users.
          </p>
        </div>

        <div className="rounded-full bg-[var(--bg-cream)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
          {generations.length} generation
          {generations.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {generations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No AI generations have been created yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {generations.map((generation) => {
            const generationImages = images[generation.id];
            const style = parseStyle(generation.styleChosen);
            const isImageLoading = imageLoading[generation.id];

            return (
              <article
                key={generation.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-cream)]"
              >
                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          Generation {generation.id}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {formatDate(generation.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => loadImages(generation)}
                        disabled={isImageLoading}
                        className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isImageLoading
                          ? "Loading images..."
                          : generationImages
                            ? "Images loaded"
                            : "Load images"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-[var(--text-secondary)]">
                          User
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {generation.user.phoneNumber}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Created
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {formatDate(generation.createdAt)}
                        </p>
                      </div>
                    </div>

                    {style && (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Selected style
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Hair color
                            </p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">
                              {style.hairColor || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Hairstyle
                            </p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">
                              {style.hairstyle || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              Makeup
                            </p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">
                              {style.makeup || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-xl bg-white">
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          Original
                        </p>
                      </div>

                      {generationImages ? (
                        <a
                          href={generationImages.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={generationImages.originalUrl}
                            alt="Original user photo"
                            className="aspect-[3/4] w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-[3/4] items-center justify-center bg-[var(--bg-cream)] p-3 text-center text-xs text-[var(--text-secondary)]">
                          Load images to view
                        </div>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white">
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          AI Result
                        </p>
                      </div>

                      {generationImages ? (
                        <a
                          href={generationImages.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={generationImages.resultUrl}
                            alt="AI generated result"
                            className="aspect-[3/4] w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-[3/4] items-center justify-center bg-[var(--bg-cream)] p-3 text-center text-xs text-[var(--text-secondary)]">
                          Load images to view
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
