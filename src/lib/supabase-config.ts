export function getSupabaseConfigError(url: string, key: string, production: boolean): string | null {
  if (!url || !key || key === 'public-anon-key') {
    return 'Account access is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the hosting environment, then rebuild and redeploy the app.';
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
    if (production && (parsed.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) {
      return 'Account access needs a public HTTPS Supabase URL. Update VITE_SUPABASE_URL, then rebuild and redeploy the app.';
    }
  } catch {
    return 'VITE_SUPABASE_URL is invalid. Set the Supabase project URL, then rebuild and redeploy the app.';
  }
  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Account request failed');
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Cannot reach the account service. Check your connection; if it continues, the site owner needs to verify the Supabase project URL and availability.';
  }
  return message;
}
