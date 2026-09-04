import fs from "node:fs";
import path from "node:path";

import { avalai } from "./avalai";

const TEST_IMAGE_PATH = path.join(process.cwd(), "public", "ai-test.jpg");

export async function testAvalAIImageGeneration() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    throw new Error(`Test image not found: ${TEST_IMAGE_PATH}`);
  }

  const result = await avalai.images.edit({
    model: "flux.1-kontext-pro",
    image: fs.createReadStream(TEST_IMAGE_PATH),
    prompt:
      "Keep the person's face and identity unchanged. Make the hairstyle look slightly more polished and salon-styled while keeping the result natural and realistic.",
    size: "1024x1024",
    n: 1,
    response_format: "b64_json",
  });

  const imageData = result.data?.[0]?.b64_json;

  if (!imageData) {
    throw new Error("AvalAI did not return a generated image.");
  }

  return Buffer.from(imageData, "base64");
}
