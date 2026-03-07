// Simulated Pica API Integration (Cover Generator)

export const coverPrompts = {
  minimalist: `Minimalist book cover for [genre] book titled "[title]", clean design, modern typography, award-winning graphic design, negative space`,
  bold: `Bold, eye-catching book cover for [genre] book "[title]", vibrant colors, dramatic lighting, cinematic composition`,
  fantasy: `Epic fantasy book cover for "[title]", magical atmosphere, detailed illustration, dark background, ethereal glow`,
  business: `Professional business book cover for "[title]", clean vector art, corporate trust, minimalistic typography, abstract geometric shapes`,
  romance: `Romantic book cover for "[title]", warm sunset lighting, soft focus, elegant script font, emotional connection`,
  vintage: `Vintage retro book cover for "[title]", worn texture, 70s typography, muted palette, nostalgic feel`
};

export const getPicaClient = () => {
  const byok = localStorage.getItem('userPicaKey');
  return byok || import.meta.env.VITE_PICA_API_KEY;
};

export async function estimateCoverCost(): Promise<{ credits: number, costZAR: number }> {
  // Typical image generation is ~0.02 USD per image -> 0.4 ZAR per image
  return { credits: 4, costZAR: 1.6 }; // 4 images = 1.6 ZAR
}

export async function generateCoverVariations(title: string, author: string, genre: string, styleKey: keyof typeof coverPrompts, customPrompt?: string) {
  const apiKey = getPicaClient();

  if (!apiKey) {
    throw new Error('No Pica API key found. Please set one in your Profile (BYOK).');
  }

  const basePrompt = coverPrompts[styleKey]
    .replace('[title]', title)
    .replace('[genre]', genre);

  const fullPrompt = `${basePrompt}. By ${author}. ${customPrompt ? customPrompt : ''}`;

  try {
    // In a real scenario, we would call the Pica REST API:
    // const response = await axios.post(PICA_API_URL, { prompt: fullPrompt, n: 4 }, { headers: { Authorization: `Bearer ${apiKey}` }});
    // return response.data.images;

    // For this build, if we have an API key (even BYOK), we simulate the success return
    console.log("Simulating Pica API call with prompt:", fullPrompt);

    return [
      `https://source.unsplash.com/random/800x1200?book,${styleKey},${genre}&sig=${Date.now()}`,
      `https://source.unsplash.com/random/800x1200?art,${styleKey},${genre}&sig=${Date.now() + 1}`,
      `https://source.unsplash.com/random/800x1200?design,${styleKey},${genre}&sig=${Date.now() + 2}`,
      `https://source.unsplash.com/random/800x1200?typography,${styleKey},${genre}&sig=${Date.now() + 3}`,
    ];
  } catch (error: any) {
    console.error("Pica Cover Error:", error);
    throw new Error(error.response?.data?.message || "Failed to generate covers");
  }
}
