import axios from 'axios';

// Get base URL from env
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.example.com/webhook';

interface OutlineData {
  title: string;
  genre: string;
  tone: string;
  synopsis: string;
}

interface ChapterData {
  title: string;
  outline_description: string;
  tone: string;
  wordCount: number;
}

export async function triggerOutlineGeneration(data: OutlineData) {
  try {
    const response = await axios.post(`${N8N_WEBHOOK_URL}/generate-outline`, data);
    return response.data;
  } catch (error: any) {
    console.error("n8n Outline Error:", error);
    throw new Error(error.response?.data?.message || "Failed to trigger n8n outline generation");
  }
}

export async function triggerChapterGeneration(data: ChapterData) {
  try {
    const response = await axios.post(`${N8N_WEBHOOK_URL}/generate-chapter`, data);
    return response.data;
  } catch (error: any) {
    console.error("n8n Chapter Error:", error);
    throw new Error(error.response?.data?.message || "Failed to trigger n8n chapter generation");
  }
}

export async function trackUsage(userId: string, provider: 'gemini' | 'pica', tokensOrCredits: number, costZar: number) {
  try {
    await axios.post(`${N8N_WEBHOOK_URL}/track-usage`, {
      userId,
      provider,
      usage: tokensOrCredits,
      costZar
    });
  } catch (error: any) {
     // Don't throw for usage tracking to prevent interrupting the user flow, just log it
    console.warn("n8n Usage Tracking Warning:", error);
  }
}