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

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Authentication
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 2. Read multipart/form-data
    // ---------------------------------------------------------

    const formData = await request.formData();

    const image = formData.get("image");
    const hairColor = formData.get("hairColor");
    const hairstyle = formData.get("hairstyle");
    const makeup = formData.get("makeup");
    const instructions = formData.get("instructions");

    // ---------------------------------------------------------
    // 3. Validate image
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 4. Validate hair color
    // ---------------------------------------------------------

    if (typeof hairColor !== "string" || !isValidHairColor(hairColor)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid hair color option.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 5. Validate hairstyle
    // ---------------------------------------------------------

    if (typeof hairstyle !== "string" || !isValidHairstyle(hairstyle)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid hairstyle option.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 6. Validate makeup
    // ---------------------------------------------------------

    if (typeof makeup !== "string" || !isValidMakeupStyle(makeup)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid makeup style option.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 7. Validate additional instructions
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 8. Build server-side prompt
    // ---------------------------------------------------------

    const prompt = buildHairdresserPrompt({
      hairColor,
      hairstyle,
      makeup,
      instructions: cleanedInstructions,
    });

    // ---------------------------------------------------------
    // 9. Convert uploaded File -> Buffer
    // ---------------------------------------------------------

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    // ---------------------------------------------------------
    // 10. Determine image type and extension
    // ---------------------------------------------------------

    const imageType = image.type as AllowedImageType;
    const extension = getExtensionFromImageType(imageType);

    // ---------------------------------------------------------
    // 11. Create unique original image key
    // ---------------------------------------------------------

    const originalKey = createAIOriginalKey(user.id, extension);

    // ---------------------------------------------------------
    // 12. Upload original image to ArvanCloud
    // ---------------------------------------------------------

    await uploadToArvan({
      key: originalKey,
      body: imageBuffer,
      contentType: imageType,
    });

    // ---------------------------------------------------------
    // 13. Generate AI result with AvalAI
    // ---------------------------------------------------------

    const generatedImage = await generateHairdresserImage({
      imageBuffer,
      imageType,
      prompt,
    });

    // ---------------------------------------------------------
    // 14. Create unique result image key
    // ---------------------------------------------------------

    const resultExtension =
      generatedImage.contentType === "image/jpeg"
        ? "jpg"
        : generatedImage.contentType === "image/webp"
          ? "webp"
          : "png";

    const resultKey = createAIResultKey(user.id, resultExtension);

    // ---------------------------------------------------------
    // 15. Upload generated result to ArvanCloud
    // ---------------------------------------------------------

    await uploadToArvan({
      key: resultKey,
      body: generatedImage.buffer,
      contentType: generatedImage.contentType,
    });

    // ---------------------------------------------------------
    // 16. Persist generation record
    // ---------------------------------------------------------

    // const generation = await prisma.generation.create({
    //   data: {
    //     userId: user.id,
    //     originalPhotoUrl: originalKey,
    //     resultPhotoUrl: resultKey,
    //     styleChosen: JSON.stringify({
    //       hairColor,
    //       hairstyle,
    //       makeup,
    //     }),
    //   },
    // });

    console.log("AI generation: creating database record", {
      userId: user.id,
      originalKey,
      resultKey,
    });

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        originalPhotoUrl: originalKey,
        resultPhotoUrl: resultKey,
        styleChosen: JSON.stringify({
          hairColor,
          hairstyle,
          makeup,
        }),
      },
    });

    console.log("AI generation: database record created", {
      generationId: generation.id,
      userId: generation.userId,
    });

    // ---------------------------------------------------------
    // 17. Successful response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "AI Hairdresser image generated successfully.",
      generationId: generation.id,
      images: {
        originalKey,
        resultKey,
      },
      options: {
        hairColor,
        hairstyle,
        makeup,
      },
      promptPrepared: Boolean(prompt),
    });
  } catch (error) {
    console.error("POST /api/ai-hairdresser error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process AI Hairdresser request.",
      },
      { status: 500 },
    );
  }
}
