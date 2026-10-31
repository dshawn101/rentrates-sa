import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const privateRoute=/^\/(?:auth|dashboard|books|book|author-guide|writing-goals|ai-providers|profile|billing|settings|api)(?:\/|$)/;
const escapeXML=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function indexablePages(config){
 const origin=new URL(config.origin);
 if(origin.protocol!=='https:'||origin.origin!==config.origin||origin.username||origin.password)throw new Error('Use the HTTPS canonical origin, without a trailing slash.');
 const seen=new Set();
 return config.pages.filter(page=>page.indexable===true).map(page=>{
  if(typeof page.path!=='string'||!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(page.path)||privateRoute.test(page.path))throw new Error(`Non-canonical or private sitemap path: ${page.path}`);
  if(seen.has(page.path))throw new Error(`Duplicate sitemap path: ${page.path}`);seen.add(page.path);
  if(!Array.isArray(page.sources)||!page.sources.length)throw new Error(`Missing content source for ${page.path}`);
  for(const source of page.sources){
   if(!source.startsWith('src/')||source.includes('..'))throw new Error('Invalid content source.');
   // Fail closed if a listed page adds an explicit robots/googlebot noindex meta tag.
   const content=readFileSync(resolve(root,source),'utf8');
   if(/<meta\b[^>]*(?:name\s*=\s*["'](?:robots|googlebot)["'][^>]*content\s*=\s*["'][^"']*noindex|content\s*=\s*["'][^"']*noindex[^"']*["'][^>]*name\s*=\s*["'](?:robots|googlebot)["'])/i.test(content))throw new Error(`Noindexed content cannot enter the sitemap: ${source}`);
  }
  return page;
 });
}
export function gitLastModified(page){
 if(page.lastModified===false)return null;
 try{
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  // Never substitute filesystem mtimes, a deployment timestamp, or a dirty working-tree date.
  if(git(['status','--porcelain','--untracked-files=all','--',...page.sources]))return null;
  const result=git(['log','-1','--format=%H %cI','--',...page.sources]);
  if(!result)return null;const [sha,date]=result.split(' ');
  if(git(['rev-parse','--is-shallow-repository'])==='true'){
   const boundaries=readFileSync(resolve(root,git(['rev-parse','--git-path','shallow'])),'utf8').split(/\s+/);
   if(boundaries.includes(sha))return null;
  }
  const parsed=new Date(date);if(!Number.isFinite(parsed.getTime())||parsed.getTime()>Date.now())return null;
  return parsed.toISOString();
 }catch{return null;}
}
export function sourceFingerprint(page){
 const hash=createHash('sha256');for(const source of [...page.sources].sort()){hash.update(source);hash.update('\0');hash.update(readFileSync(resolve(root,source)));hash.update('\0');}return hash.digest('hex');
}
export function snapshotLastModified(page,snapshot){
 const record=snapshot[page.path];
 if(page.lastModified===false||!record||record.fingerprint!==sourceFingerprint(page))return null;
 const date=new Date(record.lastmod);
 return Number.isFinite(date.getTime())&&date.getTime()<=Date.now()?date.toISOString():null;
}
export function renderSitemap(config,lastModified=gitLastModified){
 const entries=indexablePages(config).map(page=>{
  const date=lastModified(page);
  if(date&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date)||!Number.isFinite(new Date(date).getTime())||new Date(date).getTime()>Date.now()))throw new Error('lastmod must be an accurate ISO timestamp.');
  return `  <url>\n    <loc>${escapeXML(config.origin+page.path)}</loc>${date?`\n    <lastmod>${date}</lastmod>`:''}\n  </url>`;
 });
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}
export const renderRobots=origin=>`User-agent: *\nAllow: /\n\n# Keep crawling allowed so crawlers can read noindex headers on workspace/auth URLs.\nSitemap: ${origin}/sitemap.xml\n`;
export function generate(){
 const config=JSON.parse(readFileSync(resolve(root,'seo/public-pages.json'),'utf8'));
 let snapshot={};try{snapshot=JSON.parse(readFileSync(resolve(root,'seo/page-modified.json'),'utf8'));}catch{/* Dates are optional when no trustworthy history exists. */}
 if(process.argv.includes('--update-dates')){
  snapshot=Object.fromEntries(indexablePages(config).flatMap(page=>{const lastmod=gitLastModified(page);return lastmod?[[page.path,{fingerprint:sourceFingerprint(page),lastmod}]]:[];}));
  writeFileSync(resolve(root,'seo/page-modified.json'),JSON.stringify(snapshot,null,2)+'\n');
 }
 const sitemap=renderSitemap(config,page=>gitLastModified(page)||snapshotLastModified(page,snapshot));mkdirSync(resolve(root,'public'),{recursive:true});
 writeFileSync(resolve(root,'public/sitemap.xml'),sitemap);
 writeFileSync(resolve(root,'public/robots.txt'),renderRobots(config.origin));
 console.log(`Generated sitemap.xml (${indexablePages(config).length} canonical URLs) and robots.txt.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))generate();
