import { normalizeOtherBaseUrl } from '../src/lib/other-provider.js';
import { sendOther } from './other-provider.js';
export type Provider = 'gemini' | 'openai' | 'openrouter' | 'anthropic' | 'xai' | 'other';
export interface AIRequest { provider: Provider; action: 'test' | 'generate' | 'image' | 'pricing'; apiKey: string; model?: string; prompt?: string; maxOutputTokens?: number; baseUrl?: string }
export function validateAIRequest(input: unknown): AIRequest {
  if (!input || typeof input !== 'object') throw new Error('Invalid request.');
  const r = input as AIRequest;
  if (!['gemini', 'openai', 'openrouter', 'anthropic', 'xai', 'other'].includes(r.provider) || !['test', 'generate', 'image', 'pricing'].includes(r.action)) throw new Error('Unsupported provider or action.');
  if (typeof r.apiKey !== 'string' || r.apiKey.length < 8 || r.apiKey.length > 1024 || /[\r\n]/.test(r.apiKey)) throw new Error('Enter a valid API key.');
  if (!['test','pricing'].includes(r.action) && (typeof r.prompt !== 'string' || !r.prompt.trim() || r.prompt.length > 100000)) throw new Error('Enter a prompt of up to 100,000 characters.');
  if (r.action !== 'test' && (typeof r.model !== 'string' || !/^[a-zA-Z0-9_.:/-]{1,160}$/.test(r.model))) throw new Error('Enter a valid model ID.');
  if (r.action === 'image' && (r.provider !== 'openai' || !['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini', 'gpt-image-2'].includes(r.model!))) throw new Error('Choose a supported OpenAI image model.');
  if (r.provider === 'other') r.baseUrl = normalizeOtherBaseUrl(r.baseUrl);
  return r;
}
interface UpstreamResponse {
  usage?: {prompt_tokens?:number;completion_tokens?:number;input_tokens?:number;output_tokens?:number;cost?:number};
  usageMetadata?:{promptTokenCount?:number;candidatesTokenCount?:number};
  content?: { type?: string; text?: string }[];
  models?: { name: string; supportedGenerationMethods?: string[] }[];
  data?: { id: string; b64_json?: string; architecture?: { output_modalities?: string[] };pricing?:{prompt?:string;completion?:string;request?:string} }[];
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  choices?: { message?: { content?: string } }[];
}
async function readJSON(response: Response): Promise<UpstreamResponse> {
  const data = await response.json() as UpstreamResponse;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('The provider rejected this key or model access. Check your key and permissions.');
    if (response.status === 429) throw new Error('Provider quota, billing limit or rate limit reached. Check your provider account.');
    if (response.status === 404) throw new Error('This model is not available. Check its ID or choose a model returned by Test key.');
    // Never reflect provider error bodies: they can include credential-bearing URLs.
    throw new Error(`The provider request failed (${response.status}). Check model access and billing in your provider dashboard.`);
  }
  return data;
}
function usage(data:UpstreamResponse){
 const u=data.usage,g=data.usageMetadata;
 const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:undefined;
 return {inputTokens:finite(u?.prompt_tokens??u?.input_tokens??g?.promptTokenCount),outputTokens:finite(u?.completion_tokens??u?.output_tokens??g?.candidatesTokenCount),costUSD:finite(u?.cost)};
}
export async function runAI(r: AIRequest, send: typeof fetch = fetch) {
  const budget = Math.max(128, Math.min(8000, Number(r.maxOutputTokens) || 2500));
  const root = r.provider === 'openai' ? 'https://api.openai.com/v1' : r.provider === 'xai' ? 'https://api.x.ai/v1' : r.provider === 'other' ? normalizeOtherBaseUrl(r.baseUrl) : 'https://openrouter.ai/api/v1';
  // Other gets a pinned public-IP transport in production; injected fetch is for tests.
  if (r.provider === 'other' && send === fetch) send = sendOther;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${r.apiKey}` };
  const options = { redirect: 'error' as const, signal: AbortSignal.timeout(r.action === 'image' ? 170000 : 80000) };
  if(r.action==='pricing'){
    if(r.provider!=='openrouter')return {pricing:null};
    const response=await send('https://openrouter.ai/api/v1/models',{...options,headers});
    const data=await readJSON(response),p=data.data?.find(m=>m.id===r.model)?.pricing;
    const valid=(v:unknown)=>typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
    if(!p||!valid(p.prompt)||!valid(p.completion))return {pricing:null};
    return {pricing:{inputUSD:Number(p.prompt),outputUSD:Number(p.completion),requestUSD:valid(p.request)?Number(p.request):0,checkedAt:new Date().toISOString()}};
  }
  if (r.provider === 'anthropic') {
    const anthropicHeaders = { 'Content-Type':'application/json', 'x-api-key':r.apiKey, 'anthropic-version':'2023-06-01' };
    if (r.action === 'test') {
      const data = await readJSON(await send('https://api.anthropic.com/v1/models?limit=100', { ...options, headers:anthropicHeaders }));
      return { models:(data.data || []).map(m => m.id) };
    }
    const data = await readJSON(await send('https://api.anthropic.com/v1/messages', { ...options, method:'POST', headers:anthropicHeaders, body:JSON.stringify({model:r.model,max_tokens:budget,messages:[{role:'user',content:r.prompt}]}) }));
    return { usage:usage(data),text:(data.content || []).filter(part=>part.type === 'text').map(part=>part.text || '').join('') };
  }
  if (r.provider === 'gemini') {
    const googleHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': r.apiKey };
    if (r.action === 'test') {
      const data = await readJSON(await send('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { ...options, headers: googleHeaders }));
      return { models: (data.models || []).filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent')).map((m: { name: string }) => m.name.replace('models/', '')) };
    }
    const data = await readJSON(await send(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(r.model!)}:generateContent`, { ...options, method: 'POST', headers: googleHeaders, body: JSON.stringify({ contents: [{ parts: [{ text: r.prompt }] }], generationConfig: { maxOutputTokens: budget } }) }));
    return { usage:usage(data),text: data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '' };
  }
  if (r.action === 'test') {
    const endpoint = r.provider === 'openrouter' ? `${root}/key` : `${root}/models`;
    const data = await readJSON(await send(endpoint, { ...options, headers }));
    if (r.provider === 'openrouter') {
      const models = await readJSON(await send(`${root}/models`, { ...options, headers }));
      return { models: (models.data || []).filter((m: { architecture?: { output_modalities?: string[] } }) => m.architecture?.output_modalities?.includes('text')).map((m: { id: string }) => m.id).slice(0, 1000) };
    }
    return { models: (data.data || []).map((m: { id: string }) => m.id).slice(0, 1000) };
  }
  if (r.action === 'image') {
    const data = await readJSON(await send(`${root}/images/generations`, { ...options, method: 'POST', headers, body: JSON.stringify({ model: r.model, prompt: r.prompt, n: 1, size: '1024x1024', quality: 'low', output_format: 'png' }) }));
    if (!data.data?.[0]?.b64_json) throw new Error('No image returned. Check image model access.');
    return { image: `data:image/png;base64,${data.data[0].b64_json}` };
  }
  const data = await readJSON(await send(`${root}/chat/completions`, { ...options, method: 'POST', headers, body: JSON.stringify({ model: r.model, messages: [{ role: 'user', content: r.prompt }], ...(r.provider === 'openai' ? { max_completion_tokens: budget } : { max_tokens: budget }) }) }));
  return { usage:usage(data),text: data.choices?.[0]?.message?.content || '' };
}
