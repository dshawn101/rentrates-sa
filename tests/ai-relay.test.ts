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
