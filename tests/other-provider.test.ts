import {expect,it,vi} from 'vitest';
import { normalizeOtherBaseUrl } from '../src/lib/other-provider';
import { resolveOtherEndpoint } from '../server/other-provider';
import type { lookup } from 'node:dns/promises';
it.each(['http://api.example.com/v1','https://localhost/v1','https://127.0.0.1/v1','https://[::1]/v1','https://secret@api.example.com/v1','https://api.example.com/v1?key=secret','https://api.example.com:444/v1','https://metadata.google.internal/v1','https://api.example.com/v1#key'])('rejects unsafe Other endpoint %s',url=>{
 expect(()=>normalizeOtherBaseUrl(url)).toThrow();
});
it.each(['10.1.2.3','127.0.0.1','169.254.169.254','100.64.0.1','192.168.0.1','0.0.0.0','198.18.0.1','224.0.0.1','::1'])('blocks a hostname resolving to %s before sending credentials',async address=>{
 const resolve=vi.fn().mockResolvedValue([{address,family:4}]) as unknown as typeof lookup;
 await expect(resolveOtherEndpoint('https://api.example.com/v1',resolve)).rejects.toThrow('public internet');
});
it('returns the exact public address to pin, and rejects mixed public/private DNS answers',async()=>{
 const resolve=vi.fn().mockResolvedValue([{address:'8.8.8.8',family:4}]);
 expect((await resolveOtherEndpoint('https://api.example.com/v1',resolve as unknown as typeof lookup)).address).toBe('8.8.8.8');
 resolve.mockResolvedValue([{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}]);
 await expect(resolveOtherEndpoint('https://api.example.com/v1',resolve as unknown as typeof lookup)).rejects.toThrow();
});
