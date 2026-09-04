const AVALAI_IMAGES_EDIT_ENDPOINT = "https://api.avalai.ir/v1/images/edits";

const AVALAI_TIMEOUT_MS = 90_000;

type GenerateHairdresserImageInput = {
  imageBuffer: Buffer;
  imageType: string;
  prompt: string;
};

type GeneratedImageResult = {
  buffer: Buffer;
  contentType: string;
};

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return { controller, timeout };
}

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

  const formData = new FormData();

  formData.append("model", "gpt-image-1.5");
  formData.append("image", imageFile);
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");

  const { controller, timeout } = createTimeoutController(AVALAI_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(AVALAI_IMAGES_EDIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "AvalAI image generation timed out. Please try again later.",
      );
    }

    throw new Error(
      `AvalAI image generation request failed: ${
        error instanceof Error ? error.message : "Unknown network error."
      }`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `AvalAI image generation failed with status ${response.status}: ${errorText.slice(
        0,
        1000,
      )}`,
    );
  }

  let result: {
    data?: Array<{
      b64_json?: string;
      url?: string;
    }>;
  };

  try {
    result = await response.json();
  } catch {
    throw new Error("AvalAI returned an invalid JSON response.");
  }

  const imageData = result.data?.[0];

  if (!imageData) {
    throw new Error("AvalAI returned an empty image response.");
  }

  if (imageData.b64_json) {
    let buffer: Buffer;

    try {
      buffer = Buffer.from(imageData.b64_json, "base64");
    } catch {
      throw new Error("AvalAI returned invalid base64 image data.");
    }

    if (buffer.length === 0) {
      throw new Error("AvalAI returned an empty base64 image.");
    }

    return {
      buffer,
      contentType: "image/png",
    };
  }

  if (imageData.url) {
    const { controller: downloadController, timeout: downloadTimeout } =
      createTimeoutController(AVALAI_TIMEOUT_MS);

    let imageResponse: Response;

    try {
      imageResponse = await fetch(imageData.url, {
        signal: downloadController.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Downloading the AvalAI generated image timed out.");
      }

      throw new Error(
        `Failed to download AvalAI generated image: ${
          error instanceof Error ? error.message : "Unknown network error."
        }`,
      );
    } finally {
      clearTimeout(downloadTimeout);
    }

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download AvalAI generated image (${imageResponse.status}).`,
      );
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error("AvalAI generated image download was empty.");
    }

    return {
      buffer,
      contentType: imageResponse.headers.get("content-type") || "image/png",
    };
  }

  throw new Error("AvalAI response did not contain b64_json or url.");
}
