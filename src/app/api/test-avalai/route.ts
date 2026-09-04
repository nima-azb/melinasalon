import { NextResponse } from "next/server";

import { testAvalAIImageGeneration } from "@/lib/ai/avalai-image-test";

export async function GET() {
  try {
    const imageBuffer = await testAvalAIImageGeneration();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("GET /api/test-avalai error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "AvalAI image generation test failed.",
      },
      { status: 500 },
    );
  }
}
