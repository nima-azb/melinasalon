const RECOMMENDATION_PROMPT = `
Photorealistic professional salon visualization of the exact same person from the input image, presented as a clean two-panel split-screen comparison (Left Panel: Look 1 | Right Panel: Look 2). 

CRITICAL IDENTITY & REALISM RULES:
- Photorealistic, high-end editorial beauty photography style. Must look like a real, high-resolution photograph taken with a professional studio camera (Sony A7R IV, 85mm lens, f/2.8, soft studio lighting). Absolutely no illustrations, digital art, 3D renders, plastic skin, or cartoon styles.
- Preserve 100% of the person's exact identity, facial structure, bone structure, eye shape, nose, mouth, ethnicity, and age from the source photo. 
- The head pose, facial expression, camera angle, and background must remain identical or seamlessly matched across both panels.
- Maintain natural, un-retouched skin texture with visible pores and fine details. No smoothing or airbrushing.

MAKEUP & HAIR MODIFICATIONS ONLY:
Modify ONLY the hair styling, hair color, or makeup according to the two distinct looks below. The underlying face must remain strictly identical to the input photo.

LOOK 1 (Natural Elegance - Left Panel):
- Focus: A harmonious, naturally polished enhancement of existing features.
- Hair: Refined version of the current cut or a soft, classic blowout with natural texture and subtle, realistic color gloss.
- Makeup: Clean, minimal "no-makeup makeup" or soft everyday professional look with neutral tones, gentle definition to brows, and a natural lip tint.

LOOK 2 (Creative Transformation - Right Panel):
- Focus: A noticeable, stylish shift that still flatters the same face structure.
- Hair: A distinctly different professional option—such as a chic modern bob, sophisticated layering, elegant updo, or a complementary, realistic new hair shade (e.g., warm chestnut, rich espresso, or soft caramel highlights).
- Makeup: A polished evening or statement look featuring refined contouring, a defined lip color, or sophisticated eye makeup that matches the skin undertone.

COMPOSITION & FORMAT:
- Output a single image divided cleanly down the middle into two vertical panels.
- Left side displays Look 1; Right side displays Look 2.
- Clean, minimalist aesthetic with neutral studio background. No text overlays, graphic watermarks, or distorted features.
`.trim();

export function buildRecommendationPrompt() {
  return RECOMMENDATION_PROMPT;
}
