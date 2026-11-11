export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';
export const MAX_WORDS = 120_000;
export const MAX_SECTIONS = 12;
export const ANALYSIS_OUTPUT_TOKENS = 1200;
export const BLUEPRINT_OUTPUT_TOKENS = 5000;
export const WORD_LIMIT_ERROR = 'This manuscript is longer than the 120,000-word limit. Try uploading a single book rather than a box set, or paste a synopsis instead.';
// USD per million input and output tokens. Other models are deliberately unpriced.
const prices: Record<string, readonly [number, number]> = {'anthropic/claude-sonnet-4': [3, 15]};
export function estimateCost(model: string, sections: readonly string[]) {
 const rate = prices[model.trim()];
 if (!rate || !sections.length) return null;
 const input = sections.reduce((sum, section) => sum + Math.ceil(JSON.stringify(section).length / 3) + 450, 0)
   + sections.length * ANALYSIS_OUTPUT_TOKENS + 700;
 const output = sections.length * ANALYSIS_OUTPUT_TOKENS + BLUEPRINT_OUTPUT_TOKENS;
 return (input * rate[0] + output * rate[1]) / 1_000_000;
}
