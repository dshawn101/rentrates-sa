const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

export const n8n = {
  triggerOutlineGeneration: async (bookData: any) => {
    // Stub
    console.log('Webhook triggered: generate-outline', bookData);
    return { status: 'success' };
  },
  triggerChapterGeneration: async (chapterData: any) => {
    // Stub
    console.log('Webhook triggered: generate-chapter', chapterData);
    return { status: 'success' };
  },
  triggerCoverGeneration: async (bookData: any) => {
    // Stub
    console.log('Webhook triggered: generate-cover', bookData);
    return { status: 'success' };
  },
  trackUsage: async (usageData: any) => {
    // Stub
    console.log('Webhook triggered: track-usage', usageData);
  }
};
