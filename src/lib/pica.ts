export const pica = {
  coverPrompts: {
    minimalist: 'Minimalist book cover for [genre] book titled "[title]", clean design, modern typography',
    bold: 'Bold, eye-catching book cover for [genre] book "[title]", vibrant colors, dramatic',
    fantasy: 'Fantasy book cover for "[title]", magical, epic, detailed illustration',
    business: 'Professional business book cover for "[title]", clean, corporate, trustworthy',
  },
  generateCovers: async (prompt: string): Promise<string[]> => {
    // True external image generation usually requires a backend proxy to protect keys.
    // For MVP frontend BYOK demo, we mock the delay and response, as fetching arbitrary image generation endpoints client-side usually fails CORS.
    console.log("Mocking Pica API call for prompt:", prompt);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          `https://via.placeholder.com/300x450/0f172a/10b981?text=${encodeURIComponent(prompt.split(' ')[0] + " 1")}`,
          `https://via.placeholder.com/300x450/2563eb/10b981?text=${encodeURIComponent(prompt.split(' ')[0] + " 2")}`,
          `https://via.placeholder.com/300x450/10b981/0f172a?text=${encodeURIComponent(prompt.split(' ')[0] + " 3")}`,
          `https://via.placeholder.com/300x450/334155/10b981?text=${encodeURIComponent(prompt.split(' ')[0] + " 4")}`,
        ]);
      }, 2000); // Simulate network latency
    });
  }
};
