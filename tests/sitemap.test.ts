import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {expect,it} from 'vitest';
// @ts-expect-error The build script deliberately uses native Node ESM, without a browser bundle.
import {indexablePages,renderSitemap,renderRobots,snapshotLastModified,sourceFingerprint} from '../scripts/generate-sitemap.mjs';
const config=JSON.parse(readFileSync('seo/public-pages.json','utf8'));
const vercel=JSON.parse(readFileSync('vercel.json','utf8'));
const matches=(src:string,path:string)=>new RegExp(`^(?:${src})$`).test(path);
it('contains exactly the audited public pages, valid XML and one canonical production origin',()=>{
 const xml=renderSitemap(config,()=>null);const doc=new JSDOM(xml,{contentType:'application/xml'}).window.document;
 const urls=Array.from(doc.querySelectorAll('loc'),e=>e.textContent);
 expect(urls).toHaveLength(10);expect(new Set(urls).size).toBe(10);expect(doc.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
 for(const url of urls){const u=new URL(url!);expect(u.origin).toBe('https://www.publestudio.com');expect(u.search).toBe('');expect(u.hash).toBe('');}
 expect(urls).toContain('https://www.publestudio.com/help');expect(urls).toContain('https://www.publestudio.com/pricing');expect(xml).not.toContain('<lastmod>');
});
it('fails closed on private, duplicate, noncanonical or noindexed URLs',()=>{
 const page=config.pages[0];
 for(const path of ['/dashboard','/book/private-id','/api/ai','/auth/signup','//other.invalid','/pricing/','/pricing?plan=lite','/pricing#plans'])expect(()=>indexablePages({...config,pages:[{...page,path}]})).toThrow();
 expect(()=>indexablePages({...config,pages:[page,page]})).toThrow();
 expect(indexablePages({...config,pages:[{...page,indexable:false}]})).toHaveLength(0);
 expect(()=>renderSitemap(config,()=> '2026-99-99T00:00:00.000Z')).toThrow();expect(()=>renderSitemap(config,()=> '2099-01-01T00:00:00.000Z')).toThrow();
});
it('uses a historical lastmod snapshot only while the content fingerprint still matches',()=>{
 const page=config.pages[0];const snapshot={[page.path]:{fingerprint:sourceFingerprint(page),lastmod:'2026-10-30T13:13:23.000Z'}};
 expect(snapshotLastModified(page,snapshot)).toBe('2026-10-30T13:13:23.000Z');expect(snapshotLastModified(page,{[page.path]:{...snapshot[page.path],fingerprint:'stale'}})).toBeNull();
 expect(snapshotLastModified({...page,lastModified:false},snapshot)).toBeNull();
});
it('keeps every sitemap page crawlable and canonical and every private route noindexed on Vercel',()=>{
 for(const page of config.pages){const routes=vercel.routes.filter((r:any)=>r.src&&matches(r.src,page.path));expect(routes.some((r:any)=>r.headers?.Link===`<${config.origin}${page.path}>; rel="canonical"`)).toBe(true);expect(routes.some((r:any)=>r.headers?.['X-Robots-Tag']?.includes('noindex'))).toBe(false);}
 for(const path of ['/auth/login','/auth/signup','/dashboard','/books','/book/uuid','/author-guide','/writing-goals','/ai-providers','/profile','/billing','/settings','/api/ai','/api/paypal','/legal/unknown'])expect(vercel.routes.some((r:any)=>r.src&&matches(r.src,path)&&r.headers?.['X-Robots-Tag']==='noindex, follow')).toBe(true);
 const fs=vercel.routes.findIndex((r:any)=>r.handle==='filesystem');expect(fs).toBeGreaterThan(vercel.routes.findIndex((r:any)=>r.src==='/sitemap\\.xml'));
 expect(renderRobots(config.origin)).toContain('Allow: /');expect(renderRobots(config.origin)).not.toMatch(/^Disallow:/m);expect(renderRobots(config.origin)).toContain('Sitemap: https://www.publestudio.com/sitemap.xml');
});
it('covers current public routes and all concrete legal documents without indexing protected routes',()=>{
 const app=readFileSync('src/App.tsx','utf8');const publicPart=app.split('{/* Public Routes */}')[1].split('{/* Protected Routes */}')[0];
 const paths=Array.from(publicPart.matchAll(/<Route path="([^"]+)"/g),m=>m[1]).filter(p=>!p.startsWith('/auth/')&&!p.includes(':'));
 for(const path of paths)expect(config.pages.some((p:any)=>p.path===path)).toBe(true);
 const legal=readFileSync('src/pages/Legal.tsx','utf8');for(const name of Array.from(legal.matchAll(/^  ([a-z]+): \{/gm),m=>m[1]))expect(config.pages.some((p:any)=>p.path===`/legal/${name}`)).toBe(true);
});
