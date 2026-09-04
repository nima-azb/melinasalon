const AVALAI_IMAGES_EDIT_ENDPOINT = "https://api.avalai.ir/v1/images/edits";

type GenerateHairdresserImageInput = {
  imageBuffer: Buffer;
  imageType: string;
  prompt: string;
};

type GeneratedImageResult = {
  buffer: Buffer;
  contentType: string;
};

export async function generateHairdresserImage({
  imageBuffer,
  imageType,
  prompt,
}: GenerateHairdresserImageInput): Promise<GeneratedImageResult> {
  const apiKey = process.env.AVALAI_API_KEY;

  if (!apiKey) {
    throw new Error("AVALAI_API_KEY is not configured.");
  }

  const extension =
    imageType === "image/png"
      ? "png"
      : imageType === "image/webp"
        ? "webp"
        : "jpg";

  const imageCopy = new Uint8Array(imageBuffer.length);
  imageCopy.set(imageBuffer);

  const imageFile = new File(
    [imageCopy.buffer],
    `hairdresser-input.${extension}`,
    {
      type: imageType,
    },
  );

  // Switched from flux.1-kontext-pro (provider-side "Model not supported
  // with Responses API" error on AvalAI, unresolved as of the support
  // ticket) to gpt-image-1.5. Payload matches AvalAI's own documented,
  // working example for this model exactly:
  //   POST /v1/images/edits, multipart: model + image + prompt + size
  // Deliberately no response_format here, matching AvalAI's documented
  // edit example for this model (their /generations examples include
  // response_format, but their /edits example for gpt-image-1.5 does
  // not — and we've already learned the hard way that undocumented
  // extra fields get rejected).
  const formData = new FormData();

  formData.append("model", "gpt-image-1.5");
  formData.append("image", imageFile);
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");

  const response = await fetch(AVALAI_IMAGES_EDIT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `AvalAI image editing failed (${response.status}): ${errorText}`,
    );
  }

  const result: {
    data?: Array<{
      b64_json?: string;
      url?: string;
    }>;
  } = await response.json();

  const imageData = result.data?.[0];

  if (!imageData) {
    throw new Error("AvalAI returned an empty image response.");
  }

  if (imageData.b64_json) {
    return {
      buffer: Buffer.from(imageData.b64_json, "base64"),
      contentType: "image/png",
    };
  }

  if (imageData.url) {
    const imageResponse = await fetch(imageData.url);

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download AvalAI generated image (${imageResponse.status}).`,
      );
    }

    return {
      buffer: Buffer.from(await imageResponse.arrayBuffer()),
      contentType: imageResponse.headers.get("content-type") || "image/png",
    };
  }

  throw new Error("AvalAI response did not contain b64_json or url.");
}