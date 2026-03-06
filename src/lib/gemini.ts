import { GoogleGenerativeAI } from '@google/generative-ai';

// In a real BYOK setup, this instance would be created per request with the user's key.
// We fallback to the app-level key if user hasn't provided one.
let genAI: GoogleGenerativeAI;

export const initGemini = (userKey?: string) => {
  const localKey = localStorage.getItem('userGeminiKey');
  const key = userKey || localKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini API key provided");
  genAI = new GoogleGenerativeAI(key);
}

export const gemini = {
  generateBookOutline: async (title: string, genre: string, tone: string) => {
    if (!genAI) initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Using 1.5-pro as it's the latest available in the SDK
    const prompt = `Act as an expert book author. Generate a highly detailed chapter outline for a ${tone} ${genre} book titled "${title}".
    Respond with a JSON array of objects, each containing a 'title' (string) and 'summary' (string) for the chapter.
    Ensure the output is ONLY valid JSON.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Simple parse attempt. Real app needs robust regex extraction if model wraps in markdown blocks
      const jsonStr = text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Gemini outline generation failed:", e);
      // Fallback for demo
      return [{ title: 'Chapter 1: The Beginning', summary: 'Introduction to the concepts.' }];
    }
  },

  generateChapterContent: async (outline: {title: string, summary: string}, style: string, wordCount: number) => {
    if (!genAI) initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Act as an expert book author. Write a full chapter for a book.
    Chapter Title: ${outline.title}
    Chapter Summary: ${outline.summary}
    Writing Style: ${style}
    Target Length: approximately ${wordCount} words.
    Use Markdown formatting for headings and paragraphs.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error("Gemini chapter generation failed:", e);
      return `# ${outline.title}\n\n[Content generation failed or key is invalid. Please try again.]`;
    }
  },

  estimateCost: async (text: string) => {
    // Very rough heuristic for frontend MVP display: 1 token ~= 4 chars
    const tokens = Math.ceil(text.length / 4);
    // Cost calculation: roughly $0.50 per 1M tokens * 19 (ZAR exchange rate approximation) = R 9.50 / 1M tokens
    const costZAR = (tokens / 1000000) * 9.50;
    return { tokens, costZAR };
  }
};
