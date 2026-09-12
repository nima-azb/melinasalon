import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import {
  hairColors,
  hairstyles,
  makeupStyles,
  type HairColorId,
  type HairstyleId,
  type MakeupStyleId,
} from "@/lib/ai/ai-hairdresser-options";

import { buildHairdresserPrompt } from "@/lib/ai/build-hairdresser-prompt";
import { buildRecommendationPrompt } from "@/lib/ai/build-recommendation-prompt";
import { hasEligibleBooking } from "@/lib/ai/has-eligible-booking";
import {
  releaseGenerationSlot,
  reserveGenerationSlot,
} from "@/lib/ai/check-generation-rate-limit";
import { generateHairdresserImage } from "@/lib/ai/generate-hairdresser-image";

import { prisma } from "@/lib/prisma";

import { uploadToArvan } from "@/lib/storage/arvan-upload";

import {
  createAIOriginalKey,
  createAIResultKey,
} from "@/lib/storage/arvan-key";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

type WorkflowType = "custom" | "recommendation";

function isValidHairColor(value: string): value is HairColorId {
  return hairColors.some((option) => option.id === value);
}

function isValidHairstyle(value: string): value is HairstyleId {
  return hairstyles.some((option) => option.id === value);
}

function isValidMakeupStyle(value: string): value is MakeupStyleId {
  return makeupStyles.some((option) => option.id === value);
}

function getExtensionFromImageType(type: AllowedImageType) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function isWorkflowType(
  value: FormDataEntryValue | null,
): value is WorkflowType {
  return value === "custom" || value === "recommendation";
}

export async function POST(request: Request) {
  let reservedRequestId: string | null = null;
  let generationSaved = false;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const eligible = await hasEligibleBooking(user.id);

    if (!eligible) {
      return NextResponse.json(
        {
          success: false,
          message: "A confirmed booking is required to use AI Hairdresser.",
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const mode = formData.get("mode");

    if (!isWorkflowType(mode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AI Hairdresser workflow.",
        },
        { status: 400 },
      );
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "An image is required.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(image.type as AllowedImageType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported image type. Use JPEG, PNG, or WebP.",
        },
        { status: 400 },
      );
    }

    if (image.size <= 0 || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must be between 1 byte and 10 MB.",
        },
        { status: 400 },
      );
    }

    let prompt: string;
    let styleChosen: string;

    if (mode === "custom") {
      const hairColor = formData.get("hairColor");
      const hairstyle = formData.get("hairstyle");
      const makeup = formData.get("makeup");
      const instructions = formData.get("instructions");

      if (typeof hairColor !== "string" || !isValidHairColor(hairColor)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid hair color option.",
          },
          { status: 400 },
        );
      }

      if (typeof hairstyle !== "string" || !isValidHairstyle(hairstyle)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid hairstyle option.",
          },
          { status: 400 },
        );
      }

      if (typeof makeup !== "string" || !isValidMakeupStyle(makeup)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid makeup style option.",
          },
          { status: 400 },
        );
      }

      if (instructions !== null && typeof instructions !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid additional instructions.",
          },
          { status: 400 },
        );
      }

      const cleanedInstructions =
        typeof instructions === "string" ? instructions.trim() : undefined;

      prompt = buildHairdresserPrompt({
        hairColor,
        hairstyle,
        makeup,
        instructions: cleanedInstructions,
      });

      styleChosen = JSON.stringify({
        hairColor,
        hairstyle,
        makeup,
        instructions: cleanedInstructions ?? null,
      });
    } else {
      prompt = buildRecommendationPrompt();

      styleChosen = JSON.stringify({
        type: "face_based_recommendations",
        lookCount: 2,
      });
    }

    const rateLimit = await reserveGenerationSlot(user.id);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have reached the maximum number of AI generations allowed in 24 hours.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    reservedRequestId = rateLimit.requestId;

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageType = image.type as AllowedImageType;
    const extension = getExtensionFromImageType(imageType);

    const originalKey = createAIOriginalKey(user.id, extension);

    await uploadToArvan({
      key: originalKey,
      body: imageBuffer,
      contentType: imageType,
    });

    const generatedImage = await generateHairdresserImage({
      imageBuffer,
      imageType,
      prompt,
    });

    const resultExtension =
      generatedImage.contentType === "image/jpeg"
        ? "jpg"
        : generatedImage.contentType === "image/webp"
          ? "webp"
          : "png";

    const resultKey = createAIResultKey(user.id, resultExtension);

    await uploadToArvan({
      key: resultKey,
      body: generatedImage.buffer,
      contentType: generatedImage.contentType,
    });

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        workflowType: mode === "recommendation" ? "RECOMMENDATION" : "CUSTOM",
        originalPhotoUrl: originalKey,
        resultPhotoUrl: resultKey,
        styleChosen,
      },
    });

    generationSaved = true;

    return NextResponse.json({
      success: true,
      message:
        mode === "recommendation"
          ? "Two personalized AI looks generated successfully."
          : "AI Hairdresser image generated successfully.",
      generationId: generation.id,
      workflowType: mode,
      remainingGenerations: rateLimit.remaining,
      images: {
        originalKey,
        resultKey,
      },
    });
  } catch (error) {
    console.error("POST /api/ai-hairdresser error:", error);

    if (reservedRequestId && !generationSaved) {
      try {
        await releaseGenerationSlot(reservedRequestId);
      } catch (releaseError) {
        console.error("Failed to release AI generation slot:", releaseError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process AI Hairdresser request.",
      },
      { status: 500 },
    );
  }
}
