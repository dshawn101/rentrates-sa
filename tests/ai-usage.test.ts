// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {estimateCost,readUsage,recordUsage} from '../src/lib/ai-usage';
afterEach(()=>localStorage.clear());
it('calculates a labelled price scenario without making an exact-token promise',()=>{
 const result=estimateCost(3000,1000,{inputUSD:0.000001,outputUSD:0.000002,requestUSD:0.01,checkedAt:''});expect(result.inputTokens).toBe(1100);expect(result.costUSD).toBeCloseTo(0.0131);
});
it('isolates device usage by account and retains only the last 50 records',()=>{
 for(let i=0;i<55;i++)recordUsage('one',{provider:'openrouter',model:'test/model',inputTokens:i,at:new Date().toISOString()});
 expect(readUsage('one')).toHaveLength(50);expect(readUsage('two')).toEqual([]);expect(readUsage('one')[0].costUSD).toBeUndefined();expect(localStorage.getItem('puble:ai-usage:one')).not.toContain('prompt');
});
