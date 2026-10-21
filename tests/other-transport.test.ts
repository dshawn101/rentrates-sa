import { beforeEach, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { sendOther } from '../server/other-provider';
const mocks=vi.hoisted(()=>({lookup:vi.fn(),request:vi.fn()}));
vi.mock('node:dns/promises',()=>({lookup:mocks.lookup}));
vi.mock('node:https',()=>({request:mocks.request}));
beforeEach(()=>{vi.clearAllMocks();mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4}]);});
function upstream(status:number){
 mocks.request.mockImplementation((_url,options,onResponse)=>{
   const req=Object.assign(new EventEmitter(),{write:vi.fn(),setTimeout:vi.fn(),destroy:vi.fn(),end:()=>{
     const res=Object.assign(new EventEmitter(),{statusCode:status});
     onResponse(res);res.emit('data',Buffer.from('{"data":[]}'));res.emit('end');
   }});
   const callback=vi.fn();options.lookup('api.example.com',{},callback);
   expect(callback).toHaveBeenCalledWith(null,'8.8.8.8',4);
   expect(options.family).toBe(4);
   return req;
 });
}
it('pins the validated DNS address and keeps the TLS URL on the original host',async()=>{
 upstream(200);const result=await sendOther('https://api.example.com/v1/models',{headers:{Authorization:'Bearer own-key'}});
 expect(result.status).toBe(200);expect(mocks.lookup).toHaveBeenCalledTimes(1);
 expect(mocks.request.mock.calls[0][0].hostname).toBe('api.example.com');
});
it('never follows a credential-bearing redirect',async()=>{
 upstream(302);await expect(sendOther('https://api.example.com/v1/models',{headers:{Authorization:'Bearer own-key'}})).rejects.toThrow('redirected');
 expect(mocks.request).toHaveBeenCalledTimes(1);
});
it('does not open a socket if public DNS validation fails',async()=>{
 mocks.lookup.mockResolvedValue([{address:'169.254.169.254',family:4}]);
 await expect(sendOther('https://api.example.com/v1/models')).rejects.toThrow('public internet');
 expect(mocks.request).not.toHaveBeenCalled();
});
