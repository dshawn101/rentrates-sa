import {useState} from 'react';
import {importManuscript} from '../../lib/manuscript-import';
import type {ImportedChapter,ManuscriptImport as ImportResult} from '../../lib/manuscript-import';
import {GlassButton} from '../ui/GlassButton';
import {ManuscriptPreview} from './ManuscriptPreview';
export function ManuscriptImport({onImport,disabled=false}:{disabled?:boolean;onImport:(chapters:ImportedChapter[])=>void}){
 const [result,setResult]=useState<ImportResult|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <details className="rounded-xl border border-white/10 p-5"><summary className="cursor-pointer text-purple-200 font-semibold">Import an existing manuscript</summary><div className="space-y-4 mt-4">
 <p className="text-sm text-slate-400">DOCX, TXT or Markdown · up to 10 MB. Preview the chapter split, then append the imported chapters. Your existing chapters stay in place.</p>
 <input type="file" aria-label="Import manuscript file" accept=".docx,.txt,.md" disabled={busy||disabled} onChange={async e=>{const input=e.target;const file=input.files?.[0];if(!file)return;setBusy(true);setResult(null);setError('');try{setResult(await importManuscript(file.name,await file.arrayBuffer()));}catch(error){setError(error instanceof Error?error.message:'Could not import file.');}finally{setBusy(false);input.value='';}}}/>
 {busy&&<p role="status">Reading manuscript…</p>}{error&&<p role="alert" className="text-amber-200">{error}</p>}
 {result&&<div className="space-y-4">{result.warnings.map(w=><p key={w} className="text-xs text-amber-200">{w}</p>)}<p className="text-sm text-white">Preview · {result.chapters.length} chapters</p><ol className="max-h-40 overflow-y-auto list-decimal pl-5 text-sm text-slate-300">{result.chapters.map((c,i)=><li key={i}>{c.title} · {c.content.length.toLocaleString()} characters</li>)}</ol><details><summary className="text-sm text-purple-200 cursor-pointer">Preview the first imported chapter</summary><div className="mt-3 p-4 bg-black/20 rounded-lg max-h-64 overflow-auto"><ManuscriptPreview content={result.chapters[0].content} format={result.chapters[0].format}/></div></details><GlassButton disabled={disabled} onClick={()=>{onImport(result.chapters);setResult(null);}}>Add imported chapters to outline</GlassButton><GlassButton variant="ghost" onClick={()=>setResult(null)}>Cancel import</GlassButton><p className="text-xs text-slate-400">Nothing is uploaded until you save the outline. Chapter 1 / Heading 1 marks chapter boundaries; other text stays together for review.</p></div>}
 </div></details>;
}
