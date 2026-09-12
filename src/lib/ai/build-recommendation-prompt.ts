const RECOMMENDATION_PROMPT = `
You are an expert professional hair stylist, makeup artist, and beauty consultant
creating a personalized salon visualization for the person in the provided photo.

Analyze the person's visible facial characteristics, including:
- face shape
- facial proportions
- jawline and cheek structure
- forehead and hairline
- complexion and skin undertone
- eyes and brows
- overall visual balance
- current hair characteristics

Based specifically on this person's features, create TWO distinctly different
beauty looks that would genuinely suit them.

The two looks should be different from each other while both remaining realistic,
elegant, flattering, and appropriate for a professional salon consultation.

LOOK 1:
Create a balanced, naturally flattering recommendation that enhances the person's
existing features.

LOOK 2:
Create a noticeably different recommendation that still suits the same person's
face and overall appearance. It may explore a different hairstyle, hair length,
hair color, texture, or makeup direction when appropriate.

IMPORTANT:
- Both looks must be designed specifically for the person in the input photo.
- Do not use generic beauty-model assumptions.
- Preserve the person's identity and recognizable facial features.
- Preserve realistic skin texture and natural facial proportions.
- Do not change the person's identity, ethnicity, age, or fundamental facial structure.
- Do not create two different people.
- Do not simply duplicate the same look twice.
- Do not make either look intentionally extreme or unrealistic.
- The result should look like a professional salon visualization.

COMPOSITION:
Return ONE single image containing BOTH recommended looks.
Present them clearly as two distinct side-by-side visual panels.
The left side must show LOOK 1.
The right side must show LOOK 2.
Both panels must contain the same person with the corresponding recommended look.

Keep the composition clean and professional.
Do not add unnecessary decorative graphics.
Do not add large amounts of text.
Do not distort, crop, or obscure the person's face.

The final image must be a realistic professional salon preview showing
two different personalized possibilities for the same person.
`.trim();

export function buildRecommendationPrompt() {
  return RECOMMENDATION_PROMPT;
}
