import OpenAI from "openai";

const apiKey = process.env.AVALAI_API_KEY;
const baseURL = process.env.AVALAI_BASE_URL;

if (!apiKey) {
  throw new Error("AVALAI_API_KEY is not configured.");
}

if (!baseURL) {
  throw new Error("AVALAI_BASE_URL is not configured.");
}

export const avalai = new OpenAI({
  apiKey,
  baseURL,
});
