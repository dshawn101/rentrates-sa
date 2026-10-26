import { expect, it, vi } from 'vitest';
import { runAI, validateAIRequest } from '../server/ai-core';
it('rejects unsupported providers, unsafe model values and retired image models', () => {
  expect(() => validateAIRequest({ provider: 'custom', action: 'test', apiKey: 'test-secret' })).toThrow();
  expect(() => validateAIRequest({ provider: 'gemini', action: 'generate', apiKey: 'test-secret', model: '../?key=bad', prompt: 'Hello' })).toThrow();
  expect(() => validateAIRequest({ provider: 'openai', action: 'image', apiKey: 'test-secret', model: 'dall-e-3', prompt: 'Cover' })).toThrow();
});
it('sends the key only to the selected fixed provider and respects output bounds', async () => {
  const send = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Draft chapter' } }] })));
  const result = await runAI({ provider: 'openai', action: 'generate', apiKey: 'test-secret', model: 'gpt-4.1-mini', prompt: 'Write a chapter', maxOutputTokens: 90000 }, send);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
  expect(JSON.parse(send.mock.calls[0][1].body).max_completion_tokens).toBe(8000);
  expect(result.text).toBe('Draft chapter');
});
it('never retries a failed request against another provider or leaks raw errors', async () => {
  const send = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'sensitive-key-123' } }), { status: 401 }));
  await expect(runAI({ provider: 'openrouter', action: 'test', apiKey: 'test-secret' }, send)).rejects.toThrow('rejected');
  expect(send).toHaveBeenCalledTimes(1);
});
it('validates an OpenRouter key before listing public models without paid generation', async () => {
  const send = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: { limit: 10 } }))).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'anthropic/claude-sonnet-4', architecture: { output_modalities: ['text'] } }] })));
  const result = await runAI({ provider: 'openrouter', action: 'test', apiKey: 'test-secret' }, send);
  expect(send.mock.calls.map(c => c[0])).toEqual(['https://openrouter.ai/api/v1/key', 'https://openrouter.ai/api/v1/models']);
  expect(result.models).toEqual(['anthropic/claude-sonnet-4']);
});
it('uses the Anthropic Messages API and reads text content only', async () => {
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({content:[{type:'thinking',text:'not prose'},{type:'text',text:'Claude draft'}]})));
  const result=await runAI({provider:'anthropic',action:'generate',apiKey:'anthropic-secret',model:'selected-model',prompt:'Write',maxOutputTokens:400},send);
  expect(send.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
  expect(send.mock.calls[0][1].headers).toMatchObject({'x-api-key':'anthropic-secret','anthropic-version':'2023-06-01'});
  expect(JSON.parse(send.mock.calls[0][1].body)).toMatchObject({max_tokens:400,model:'selected-model'});
  expect(result.text).toBe('Claude draft');
});
it('lists Anthropic models without generating text',async()=>{
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{id:'claude-test'}]})));
  expect((await runAI({provider:'anthropic',action:'test',apiKey:'anthropic-secret'},send)).models).toEqual(['claude-test']);
  expect(send.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/models?limit=100');
  expect(send.mock.calls[0][1].method).toBeUndefined();
});
it.each(['xai','other'] as const)('uses the configured %s endpoint with its own key',async provider=>{
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'A draft'}}]})));
  await runAI({provider,action:'generate',apiKey:'provider-secret',model:'chosen-model',prompt:'Write',baseUrl:'https://api.example.com/v2'},send);
  expect(send.mock.calls[0][0]).toBe(provider==='xai'?'https://api.x.ai/v1/chat/completions':'https://api.example.com/v2/chat/completions');
  expect(send.mock.calls[0][1].headers.Authorization).toBe('Bearer provider-secret');
  expect(send.mock.calls[0][1].redirect).toBe('error');
});
it.each(['anthropic','xai','other'])('rejects image generation for %s',provider=>{
  expect(()=>validateAIRequest({provider,action:'image',apiKey:'provider-secret',model:'gpt-image-1',prompt:'Cover',baseUrl:'https://api.example.com/v1'})).toThrow();
});
it('reports only normalized provider usage fields, with missing cost kept unknown',async()=>{
 const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'Draft'}}],usage:{prompt_tokens:123,completion_tokens:45,cost:0.002,secret:'must-not-return'}})));
 const result=await runAI({provider:'openrouter',action:'generate',apiKey:'provider-secret',model:'author/model',prompt:'Write'},send);
 expect(result.usage).toEqual({inputTokens:123,outputTokens:45,costUSD:0.002});expect(JSON.stringify(result)).not.toContain('must-not-return');
});
it('looks up OpenRouter prices without sending manuscript text or generating',async()=>{
 const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{id:'author/model',pricing:{prompt:'0.000001',completion:'0.000002',request:'0'}}]})));
 const input=validateAIRequest({provider:'openrouter',action:'pricing',apiKey:'provider-secret',model:'author/model'});
 const result=await runAI(input,send);expect(result.pricing).toMatchObject({inputUSD:0.000001,outputUSD:0.000002,requestUSD:0});expect(send.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/models');expect(send.mock.calls[0][1].body).toBeUndefined();
});
it('does not interpret missing or negative rates as a free model',async()=>{
 const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{id:'author/model',pricing:{prompt:'-1'}}]})));
 expect((await runAI({provider:'openrouter',action:'pricing',apiKey:'provider-secret',model:'author/model'},send)).pricing).toBeNull();
});
