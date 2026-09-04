import {
  hairColors,
  hairstyles,
  makeupStyles,
  type HairColorId,
  type HairstyleId,
  type MakeupStyleId,
} from "./ai-hairdresser-options";

const BASE_PROMPT = `
You are a professional hair and makeup visualization assistant for a salon.

Edit the provided person's photo according to the selected hair and makeup options.

Preserve the person's identity, facial structure, skin tone, and natural facial features.
The result should look realistic, natural, high quality, and suitable as a professional salon preview.

Only change the requested hair and makeup characteristics.
Do not unnecessarily alter the person's face, body, background, or identity.
`.trim();

type BuildHairdresserPromptInput = {
  hairColor: HairColorId;
  hairstyle: HairstyleId;
  makeup: MakeupStyleId;
  instructions?: string;
};

export function buildHairdresserPrompt({
  hairColor,
  hairstyle,
  makeup,
  instructions,
}: BuildHairdresserPromptInput) {
  const hairColorOption = hairColors.find((option) => option.id === hairColor);

  const hairstyleOption = hairstyles.find((option) => option.id === hairstyle);

  const makeupOption = makeupStyles.find((option) => option.id === makeup);

  if (!hairColorOption) {
    throw new Error("Invalid hair color option.");
  }

  if (!hairstyleOption) {
    throw new Error("Invalid hairstyle option.");
  }

  if (!makeupOption) {
    throw new Error("Invalid makeup option.");
  }

  const userInstructions = instructions?.trim();

  return [
    BASE_PROMPT,
    `Hair color: ${hairColorOption.prompt}.`,
    `Hairstyle: ${hairstyleOption.prompt}.`,
    `Makeup: ${makeupOption.prompt}.`,
    userInstructions
      ? `Additional user instructions: ${userInstructions}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
