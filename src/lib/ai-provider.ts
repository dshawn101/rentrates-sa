import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'gemini' | 'openrouter' | 'huggingface';

interface GenerationOptions {
  provider?: AIProvider;
  modelOverride?: string;
  temperature?: number;
}

export class MultiProviderAI {
  private static getGeminiKey() {
    return localStorage.getItem('userGeminiKey') || import.meta.env.VITE_GEMINI_API_KEY;
  }

  static async generate(prompt: string, options?: GenerationOptions): Promise<{ text: string, providerUsed: AIProvider }> {
    const preferredProvider = options?.provider || 'gemini';

    // Attempt Primary Provider
    try {
      if (preferredProvider === 'gemini') {
        return await this.callGemini(prompt, options?.modelOverride);
      }
      if (preferredProvider === 'openrouter') {
         return await this.callOpenRouter(prompt);
      }
    } catch (error) {
      console.warn(`Primary provider ${preferredProvider} failed. Attempting fallback...`, error);
    }

    // Fallback Logic
    try {
      if (preferredProvider !== 'gemini') {
          return await this.callGemini(prompt, 'gemini-1.5-flash');
      }
      return await this.callOpenRouter(prompt); // Hypothetical
    } catch (fallbackError) {
      console.error("All AI providers failed.", fallbackError);
      throw new Error("AI Generation failed across all available providers. Please try again later or check your API keys.");
    }

    throw new Error("Unexpected routing failure.");
  }

  private static async callGemini(prompt: string, modelName = "gemini-1.5-pro"): Promise<{text: string, providerUsed: AIProvider}> {
    const key = this.getGeminiKey();
    if (!key) throw new Error("No Gemini API Key");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);

    return {
      text: result.response.text(),
      providerUsed: 'gemini'
    };
  }

  private static async callOpenRouter(prompt: string): Promise<{text: string, providerUsed: AIProvider}> {
     // Simulated OpenRouter call for Claude/Llama
     const key = localStorage.getItem('userOpenRouterKey');
     if (!key) throw new Error("No OpenRouter Key available for this tier.");

     // Simulate network request
     await new Promise(r => setTimeout(r, 1500));
     return {
       text: "[OpenRouter Generated]: " + prompt.substring(0, 100) + "...",
       providerUsed: 'openrouter'
     };
  }
}
