import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { normalizeOtherBaseUrl } from '../src/lib/other-provider.js';
const blocked = new BlockList();
for (const [network,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]] as const) blocked.addSubnet(network,prefix,'ipv4');
export async function resolveOtherEndpoint(baseUrl: string, resolve: typeof lookup = lookup) {
  const url = new URL(normalizeOtherBaseUrl(baseUrl));
  // Only public IPv4 endpoints are supported. Pin the validated address below to
  // prevent DNS rebinding; HTTPS still verifies the original provider hostname.
  const addresses = await resolve(url.hostname, { all:true, family:4 });
  if (!addresses.length || addresses.some(a => isIP(a.address) !== 4 || blocked.check(a.address,'ipv4'))) throw new Error('The provider URL must resolve only to public internet addresses.');
  return { url, address:addresses[0].address };
}
export async function sendOther(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
  const {url: target,address} = await resolveOtherEndpoint(input instanceof Request ? input.url : String(input));
  return new Promise((resolve,reject) => {
    const req = request(target, {
      family:4, method:init?.method || 'GET', headers:init?.headers as Record<string,string>,
      signal:init?.signal || undefined,
      lookup:(_hostname,_options,callback) => callback(null,address,4),
    }, response => {
      const chunks:Buffer[]=[];let bytes=0;
      response.on('data',(chunk:Buffer) => { bytes+=chunk.length;if(bytes>8_000_000){req.destroy(new Error('Provider response too large.'));return;}chunks.push(chunk); });
      response.on('error',reject);
      response.on('end',() => {
        // Never follow redirects with a credential, including same-host redirects.
        const status=response.statusCode || 502;
        if(status>=300 && status<400) return reject(new Error('The provider URL redirected. Use its final API base URL.'));
        if(status<200 || status>599) return reject(new Error('Invalid provider response.'));
        resolve(new Response([204,205].includes(status) ? null : Buffer.concat(chunks).toString('utf8'),{status}));
      });
    });
    req.on('error',reject);
    req.setTimeout(80000,()=>req.destroy(new Error('Provider timed out.')));
    if (init?.body) req.write(init.body);
    req.end();
  });
}
