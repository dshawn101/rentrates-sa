import { GoogleGenerativeAI } from '@google/generative-ai';

// Cost constants for Gemini 3.1 Pro (simulated values based on typical API pricing)
// In ZAR per 1k tokens (roughly $0.0005 input, $0.0015 output for Pro models)
const INPUT_COST_ZAR_PER_1K = 0.01;
const OUTPUT_COST_ZAR_PER_1K = 0.03;

export const getGeminiClient = () => {
  // 1. Try BYOK (Bring Your Own Key) from local storage first
  const byok = localStorage.getItem('userGeminiKey');
  if (byok) {
    return new GoogleGenerativeAI(byok);
  }

  // 2. Fallback to platform key
  const platformKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!platformKey) {
    throw new Error('No Google Gemini API key found. Please set one in your Profile (BYOK).');
  }

  return new GoogleGenerativeAI(platformKey);
};

export async function estimateCost(inputText: string, expectedOutputTokens: number = 500): Promise<{ tokens: number, costZAR: number }> {
  // Rough estimation: 1 token ≈ 4 characters
  const inputTokens = Math.ceil(inputText.length / 4);
  const totalCost = (inputTokens / 1000 * INPUT_COST_ZAR_PER_1K) + (expectedOutputTokens / 1000 * OUTPUT_COST_ZAR_PER_1K);

  return {
    tokens: inputTokens + expectedOutputTokens,
    costZAR: Number(totalCost.toFixed(4))
  };
}

export async function generateBookOutline(title: string, genre: string, tone: string, synopsis?: string) {
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" }); // Using 1.5 Pro as standard alias

  const prompt = `
    You are an expert book editor and outliner. Create a 5-chapter outline for a ${tone} ${genre} book titled "${title}".
    ${synopsis ? `Context/Synopsis: ${synopsis}` : ''}

    Return the response as a valid JSON array of objects. Do not use markdown code blocks.
    Each object must have exactly two keys:
    - "title": The title of the chapter.
    - "description": A brief description of what happens in the chapter.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON safely (removing potential markdown formatting)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Gemini Outline Error:", error);
    throw new Error(error.message || "Failed to generate outline");
  }
}

export async function generateChapterContent(chapterTitle: string, outlineDesc: string, tone: string, wordCount: number = 1000) {
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
    Write a chapter for a book. The tone should be ${tone}.
    Chapter Title: ${chapterTitle}
    Chapter Outline: ${outlineDesc}

    Aim for approximately ${wordCount} words. Write in well-formatted paragraphs. Do not include the chapter title in the text, just the content.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini Chapter Error:", error);
    throw new Error(error.message || "Failed to generate chapter content");
  }
}
