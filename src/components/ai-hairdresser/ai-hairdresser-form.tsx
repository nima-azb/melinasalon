"use client";

import { useState } from "react";

import {
  hairColors,
  hairstyles,
  makeupStyles,
  type HairColorId,
  type HairstyleId,
  type MakeupStyleId,
} from "@/lib/ai/ai-hairdresser-options";

type ApiResponse = {
  success: boolean;
  message?: string;
  images?: {
    originalKey: string;
    resultKey: string;
  };
};

export function AIHairdresserForm() {
  const [image, setImage] = useState<File | null>(null);
  const [hairColor, setHairColor] = useState<HairColorId | "">("");
  const [hairstyle, setHairstyle] = useState<HairstyleId | "">("");
  const [makeup, setMakeup] = useState<MakeupStyleId | "">("");
  const [instructions, setInstructions] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultKey, setResultKey] = useState("");

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedImage = event.target.files?.[0] ?? null;

    setImage(selectedImage);
    setError("");
    setResultKey("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResultKey("");

    if (!image) {
      setError("Please choose a photo first.");
      return;
    }

    if (!hairColor || !hairstyle || !makeup) {
      setError("Please select a hair color, hairstyle, and makeup style.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("image", image);
      formData.append("hairColor", hairColor);
      formData.append("hairstyle", hairstyle);
      formData.append("makeup", makeup);

      if (instructions.trim()) {
        formData.append("instructions", instructions.trim());
      }

      // const response = await fetch("/api/ai-hairdresser", {
      //   method: "POST",
      //   body: formData,
      // });

      // const data: ApiResponse = await response.json();

      console.log("AI Hairdresser: sending request...");

      const response = await fetch("/api/ai-hairdresser", {
        method: "POST",
        body: formData,
      });

      console.log(
        "AI Hairdresser: response received",
        response.status,
        response.statusText,
      );

      const responseText = await response.text();

      console.log("AI Hairdresser: raw response", responseText);

      let data: ApiResponse;

      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate the image.");
      }

      if (!data.images?.resultKey) {
        throw new Error("The image was generated, but no result was returned.");
      }

      setResultKey(data.images.resultKey);
    } catch (requestError) {
      console.error("AI Hairdresser request failed:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while generating the image.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-8 rounded-2xl bg-white p-6 shadow-sm"
    >
      {/* Photo */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Upload your photo
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Upload a clear photo of yourself for the AI preview.
        </p>

        <label
          htmlFor="ai-hairdresser-image"
          className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-gray-400"
        >
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              {image ? image.name : "Choose a photo"}
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              JPEG, PNG or WebP
            </p>
          </div>

          <input
            id="ai-hairdresser-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={isSubmitting}
            className="sr-only"
          />
        </label>
      </section>

      {/* Hair color */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Hair color
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hairColors.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setHairColor(option.id)}
              disabled={isSubmitting}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                hairColor === option.id
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                  : "border-gray-200 bg-white text-[var(--text-primary)] hover:border-gray-400"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Hairstyle */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Hairstyle
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {hairstyles.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setHairstyle(option.id)}
              disabled={isSubmitting}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                hairstyle === option.id
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                  : "border-gray-200 bg-white text-[var(--text-primary)] hover:border-gray-400"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Makeup */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Makeup
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {makeupStyles.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMakeup(option.id)}
              disabled={isSubmitting}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                makeup === option.id
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                  : "border-gray-200 bg-white text-[var(--text-primary)] hover:border-gray-400"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Additional instructions */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Additional instructions
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tell the AI anything else you would like to consider.
        </p>

        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={5}
          maxLength={1000}
          disabled={isSubmitting}
          placeholder="For example: Keep my face natural and make the result look realistic."
          className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 disabled:bg-gray-50"
        />

        <p className="mt-1 text-left text-xs text-[var(--text-secondary)]">
          {instructions.length}/1000
        </p>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[var(--text-primary)] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Generating your look..." : "Generate my look"}
      </button>

      {/* Result */}
      {resultKey && (
        <section className="rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Your AI result
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your image has been generated successfully.
          </p>

          <p className="mt-3 break-all text-xs text-[var(--text-secondary)]">
            Result stored as: {resultKey}
          </p>
        </section>
      )}
    </form>
  );
}
