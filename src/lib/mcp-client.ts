import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
export interface RemoteTool { name: string; description?: string; inputSchema: Record<string, unknown> }
export function validateMCPUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port && url.port !== '443') throw new Error('Use a public HTTPS MCP endpoint without credentials, query parameters or a custom port.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal') || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) throw new Error('Use a public server hostname, not a local address.');
  return url.href;
}
async function connect(url: string, token: string) {
  const endpoint = validateMCPUrl(url);
  const client = new Client({ name: 'puble-studio', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), { requestInit: { credentials: 'omit', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) }, reconnectionOptions: { maxRetries: 0, maxReconnectionDelay: 1000, initialReconnectionDelay: 1000, reconnectionDelayGrowFactor: 1 } });
  try { await client.connect(transport, { timeout: 20000 }); return client; }
  catch { await client.close().catch(() => {}); throw new Error('Could not connect. Check the endpoint, OAuth access token and browser CORS support. This app supports remote Streamable HTTP servers, not desktop stdio commands.'); }
}
export async function discoverTools(url: string, token: string): Promise<RemoteTool[]> {
  const client = await connect(url, token);
  try {
    const tools: RemoteTool[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = await client.listTools({ cursor }, { timeout: 20000 });
      tools.push(...result.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })));
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    return tools;
  } finally { await client.close().catch(() => {}); }
}
export async function runRemoteTool(url: string, token: string, name: string, args: Record<string, unknown>): Promise<string> {
  const client = await connect(url, token);
  try {
    const available = await client.listTools();
    if (!available.tools.some(t => t.name === name)) throw new Error('This tool is no longer offered by the server. Refresh its tools.');
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 90000 });
    return JSON.stringify(result, null, 2).slice(0, 30000);
  } finally { await client.close().catch(() => {}); }
}
