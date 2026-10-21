// Shared structural validation; the relay also resolves and pins a public IP.
export function normalizeOtherBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) throw new Error('Enter an HTTPS API base URL.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Enter an HTTPS API base URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443') || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || url.hostname.endsWith('.local') || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.internal') || !/^\/[a-zA-Z0-9._/-]*$/.test(url.pathname)) throw new Error('Use a public HTTPS API base URL without credentials, query parameters or a custom port.');
  return url.href.replace(/\/$/, '');
}
