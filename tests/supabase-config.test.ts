import { expect, it } from 'vitest';
import { getAuthErrorMessage, getSupabaseConfigError } from '../src/lib/supabase-config';
it('reports missing build configuration instead of silently using localhost', () => {
  expect(getSupabaseConfigError('', '', true)).toContain('VITE_SUPABASE_URL');
});
it('rejects localhost in production but permits an explicitly configured local backend in development', () => {
  expect(getSupabaseConfigError('http://localhost:54321', 'key', true)).toContain('public HTTPS');
  expect(getSupabaseConfigError('http://localhost:54321', 'key', false)).toBeNull();
});
it('accepts a public HTTPS endpoint and rejects invalid URLs', () => {
  expect(getSupabaseConfigError('https://example.supabase.co', 'key', true)).toBeNull();
  expect(getSupabaseConfigError('not-a-url', 'key', true)).toContain('invalid');
});
it('explains network errors while preserving actionable authentication errors', () => {
  expect(getAuthErrorMessage(new TypeError('Failed to fetch'))).toContain('Cannot reach');
  expect(getAuthErrorMessage({ message: 'Email rate limit exceeded' })).toBe('Email rate limit exceeded');
});
