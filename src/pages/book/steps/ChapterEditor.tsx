import { useEffect, useRef, useState } from 'react';
import { useBookStore, type Book } from '../../../store/useBookStore';
import { countWords } from '../../../lib/book-stats';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { ManuscriptPreview } from '../../../components/book/ManuscriptPreview';
import type { ContentFormat } from '../../../lib/manuscript-format';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { MultiProviderAI } from '../../../lib/ai-provider';

interface Chapter { id:string; title:string; content:string; revision:number; content_format:ContentFormat; deleted_at?:string|null; ai_contribution?:{outline_description?:string}; updated_at?:string }
interface Draft { content:string; format:ContentFormat; revision:number }
interface Version { content:string; format:ContentFormat; revision:number; savedAt:string }
const columns='id,title,content,revision,content_format,deleted_at,ai_contribution,updated_at,order_index';
export function ChapterEditor({book,onNext,onPrev,initialChapterId}:{initialChapterId?:string;book:Book;onNext:()=>void;onPrev:()=>void}) {
 const {addToast}=useToastStore();
 const [chapters,setChapters]=useState<Chapter[]>([]),[selected,setSelected]=useState(''),[loading,setLoading]=useState(true);
 const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[generating,setGenerating]=useState(false),[paused,setPaused]=useState(false);
 const [status,setStatus]=useState(''),[conflict,setConflict]=useState<Chapter|null>(null),[proposal,setProposal]=useState<{id:string;original:string;revision:number;content:string}|null>(null);
 const [preview,setPreview]=useState(false),[focus,setFocus]=useState(false),[search,setSearch]=useState(''),[includeNotes,setIncludeNotes]=useState(false),[history,setHistory]=useState<Version[]|null>(null),[restore,setRestore]=useState<Version|null>(null);
 const ref=useRef({chapters,selected,dirty});ref.current={chapters,selected,dirty};
 const generatingRef=useRef(false);
 const savingRef=useRef<Promise<boolean>|null>(null),textarea=useRef<HTMLTextAreaElement>(null),mounted=useRef(true);
 const key=(id:string)=>`puble:draft:${book.user_id}:${book.id}:${id}`;
 const chapter=chapters.find(c=>c.id===selected);
 const persist=(c:Chapter)=>{try{localStorage.setItem(key(c.id),JSON.stringify({content:c.content,format:c.content_format,revision:c.revision}));return true;}catch{setStatus('Device recovery is unavailable. Save before leaving.');return false;}};
 const replace=(c:Chapter)=>{setChapters(all=>all.map(v=>v.id===c.id?c:v));ref.current.chapters=ref.current.chapters.map(v=>v.id===c.id?c:v);};
 useEffect(()=>{mounted.current=true;let active=true;(async()=>{
  setLoading(true);const {data,error}=await supabase.from('chapters').select(columns).eq('book_id',book.id).order('order_index',{ascending:true});
  if(!active)return;
  if(error){addToast('Could not load chapters. Please retry from the outline.','error');setLoading(false);return;}
  const rows=(data||[]).filter(c=>!c.deleted_at).map(c=>({...c,content:c.content||'',revision:c.revision??0,content_format:c.content_format||'plain'})) as Chapter[];
  // Resume the last chapter on this device, without changing the book's saved prose.
  let last='';try{last=localStorage.getItem(`puble:resume:${book.user_id}:${book.id}`)||'';}catch{/* optional */}
  setChapters(rows);setSelected(rows.find(c=>c.id===initialChapterId)?.id||rows.find(c=>c.id===last)?.id||rows[0]?.id||'');setLoading(false);
 })();return()=>{active=false;mounted.current=false;};},[book.id]);
 useEffect(()=>{
  if(!selected)return;const c=ref.current.chapters.find(v=>v.id===selected);if(!c)return;
  setHistory(null);setRestore(null);setProposal(null);setConflict(null);setPaused(false);setDirty(false);setStatus('Saved');
  try{
   localStorage.setItem(`puble:resume:${book.user_id}:${book.id}`,selected);
   const raw=localStorage.getItem(key(selected));
   const legacy=sessionStorage.getItem(`chapter-draft:${book.id}:${selected}`);
   if(!raw&&legacy===null)return;
   const draft:Draft=raw?JSON.parse(raw):{content:legacy!,format:c.content_format,revision:-1};if(typeof draft.content!=='string'||!['plain','markdown'].includes(draft.format)||!Number.isInteger(draft.revision))return;
   if(draft.content===c.content&&draft.format===c.content_format){localStorage.removeItem(key(selected));sessionStorage.removeItem(`chapter-draft:${book.id}:${selected}`);return;}
   replace({...c,content:draft.content,content_format:draft.format});setDirty(true);
   if(!raw&&persist({...c,content:draft.content,content_format:draft.format,revision:-1}))sessionStorage.removeItem(`chapter-draft:${book.id}:${selected}`);
   if(draft.revision!==c.revision){setConflict(c);setPaused(true);setStatus('Recovered draft differs from the cloud. Review both versions.');}
   else setStatus('Recovered device draft; waiting to save');
  }catch{setStatus('Device recovery is unavailable. Save before leaving.');}
 },[selected]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(ref.current.dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 const edit=(content:string,format=chapter?.content_format||'plain')=>{
  const c=ref.current.chapters.find(v=>v.id===ref.current.selected);if(!c)return;
  const next={...c,content,content_format:format};replace(next);setDirty(true);ref.current.dirty=true;
  if(!conflict)setPaused(false);if(persist(next))setStatus('Saved on this device; waiting for cloud save');
 };
 const save=async():Promise<boolean>=>{
  if(savingRef.current)return savingRef.current;
  if(!ref.current.dirty)return true;if(conflict)return false;
  const c=ref.current.chapters.find(v=>v.id===ref.current.selected);if(!c)return false;
  const operation=(async()=>{
   setSaving(true);setStatus('Saving…');
   try{
    const {data,error}=await supabase.rpc('save_chapter_draft',{p_id:c.id,p_content:c.content,p_format:c.content_format,p_revision:c.revision});
    if(error)throw error;if(!data)throw new Error('Save was not confirmed. Retry before leaving.');
    if(!mounted.current)return false;
    const current=ref.current.chapters.find(v=>v.id===c.id)!;
    const stillDirty=current.content!==c.content||current.content_format!==c.content_format;
    const next={...current,revision:data.revision,updated_at:data.updated_at};replace(next);
    setDirty(stillDirty);ref.current.dirty=stillDirty;setPaused(false);setHistory(null);
    if(stillDirty){persist(next);setStatus('Newer edits waiting to save');}else{try{localStorage.removeItem(key(c.id));}catch{/* cloud copy is safe */}setStatus('Saved');}
    useBookStore.getState().setWordCount(book.id,ref.current.chapters.reduce((sum,v)=>sum+countWords(v.content,v.content_format),0));
    return !stillDirty;
   }catch(error){
    const e=error as {code?:string;message?:string};setPaused(true);
    if(e.code==='40001'){
     const result=await supabase.from('chapters').select(columns).eq('id',c.id).single();
     if(result.data)setConflict(result.data as Chapter);
     setStatus('Cloud version changed. Your edits remain in the editor; review before saving.');
    }else setStatus(e.message||'Cloud save failed. Your device draft is retained; retry Save.');
    return false;
   }finally{setSaving(false);savingRef.current=null;}
  })();savingRef.current=operation;return operation;
 };
 useEffect(()=>{if(!dirty||paused||saving||conflict)return;const timer=setTimeout(()=>{void save();},1500);return()=>clearTimeout(timer);},[chapters,dirty,paused,saving,conflict]);
 const navigate=async(action:()=>void)=>{if(await save())action();};
 const resolveConflict=(useCloud:boolean)=>{
  if(!conflict||!chapter)return;
  const next=useCloud?conflict:{...chapter,revision:conflict.revision};replace(next);setConflict(null);setPaused(false);setDirty(!useCloud);ref.current.dirty=!useCloud;
  if(useCloud){try{localStorage.removeItem(key(chapter.id));}catch{/* optional */}setStatus('Saved');}else{persist(next);setStatus('Your draft is ready to save over the reviewed cloud version');}
 };
 const requestAI=async(action:'write'|'expand'|'improve'|'rephrase')=>{
  if(!chapter||generatingRef.current)return;
  generatingRef.current=true;setGenerating(true);
  if(!(await save())){generatingRef.current=false;setGenerating(false);return;}
  const c=ref.current.chapters.find(v=>v.id===selected)!;
  if(action!=='write'&&!c.content.trim()){addToast('Write some text before using this action.','info');generatingRef.current=false;setGenerating(false);return;}
  setGenerating(true);
  try{
   const context=`Book: ${book.title}. Chapter: ${c.title}. Tone: ${book.metadata?.tone||'author-led'}. Outline: ${c.ai_contribution?.outline_description||''}. Return only manuscript text, preserving basic Markdown formatting where present.${includeNotes&&book.metadata?.bookNotes?'\nAuthor-selected book notes / voice guide: '+String(book.metadata.bookNotes).slice(0,20000):''}`;
   const instruction=action==='write'?'Draft approximately 500 words.':action==='expand'?'Write a continuation of this text.':action==='improve'?'Improve flow and grammar, preserving the author’s meaning.':'Rephrase this text, preserving the author’s meaning.';
   const {text,providerUsed,fallbackUsed}=await MultiProviderAI.generate(`${context}\n${instruction}\n\n${action==='write'?'':c.content}`);
   if(!text.trim())throw new Error('The provider returned no suggestion.');
   setProposal({id:c.id,original:c.content,revision:c.revision,content:action==='write'||action==='expand'?[c.content,text].filter(Boolean).join('\n\n'):text});
   addToast(`Suggestion ready via ${providerUsed.toUpperCase()}${fallbackUsed?' (fallback)':''}. Review before accepting.`,'info');
  }catch(e){addToast(e instanceof Error?e.message:'AI request failed.','error');}finally{generatingRef.current=false;setGenerating(false);}
 };
 const accept=async()=>{
  if(!proposal||!chapter)return;
  if(chapter.id!==proposal.id||chapter.content!==proposal.original||chapter.revision!==proposal.revision){addToast('Your chapter changed. Request a fresh suggestion to protect your edits.','info');return;}
  edit(proposal.content);setProposal(null);await save();
 };
 const loadHistory=async()=>{const {data,error}=await supabase.from('chapters').select('version_history').eq('id',selected).single();if(error)addToast('Could not load saved history.','error');else setHistory((data?.version_history||[]).slice().reverse());};
 const format=(before:string,after='')=>{const el=textarea.current;if(!el||!chapter)return;const start=el.selectionStart,end=el.selectionEnd;edit(chapter.content.slice(0,start)+before+(chapter.content.slice(start,end)||'text')+after+chapter.content.slice(end),'markdown');};
 return <div className="h-full overflow-y-auto max-w-7xl mx-auto px-4 pb-24 space-y-4">
  <div className="flex gap-3 flex-wrap"><GlassButton variant="secondary" disabled={saving||generating} onClick={()=>navigate(onPrev)}>Back to Outline</GlassButton><GlassButton disabled={loading||saving||generating||!chapters.length||!!proposal} onClick={()=>navigate(onNext)}>Continue</GlassButton><button className="text-primary" onClick={()=>setFocus(!focus)}>{focus?'Show chapters':'Focus mode'}</button></div>
  <div className={`grid gap-4 ${focus?'':'md:grid-cols-[240px_1fr]'}`}>
   {!focus&&<GlassCard className="p-4 space-y-3"><h3 className="font-bold text-white">Chapters</h3><input aria-label="Search manuscript" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search titles or text" className="w-full bg-black/30 rounded p-2 text-white"/>{loading?<p>Loading…</p>:chapters.filter(c=>(c.title+' '+c.content).toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.id} disabled={saving||generating||!!proposal} onClick={()=>navigate(()=>setSelected(c.id))} className={`block w-full text-left p-2 rounded ${selected===c.id?'bg-primary/25 text-white':'text-slate-400'}`}>{c.title}<small className="block">{countWords(c.content,c.content_format)} words</small></button>)}</GlassCard>}
   <GlassCard className="p-4 space-y-4 min-w-0">{chapter?<>
    <h2 className="font-bold text-white text-xl">{chapter.title}</h2><div role="status" className="text-sm text-slate-300">{status}</div>
    {conflict&&<section className="border border-primary p-4 rounded space-y-3"><h3 className="text-white font-bold">Review the cloud version</h3><p className="text-sm text-slate-300">Your draft remains in the editor below. Keeping it will save the reviewed cloud text in history.</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap text-slate-300">{conflict.content}</pre><GlassButton onClick={()=>resolveConflict(false)}>Keep my draft</GlassButton><GlassButton variant="secondary" onClick={()=>resolveConflict(true)}>Use cloud version</GlassButton></section>}
    <div className="flex flex-wrap gap-3 items-center"><GlassButton size="sm" onClick={()=>save()} disabled={saving||!!conflict}>Save</GlassButton><button onClick={()=>setPreview(!preview)} className="text-primary">{preview?'Edit':'Preview'}</button><button onClick={()=>loadHistory()} className="text-primary">Saved history</button><select aria-label="Text format" value={chapter.content_format} onChange={e=>edit(chapter.content,e.target.value as ContentFormat)} disabled={generating||!!proposal} className="bg-slate-900 text-white p-1 rounded"><option value="plain">Plain text</option><option value="markdown">Basic Markdown</option></select></div>
    {!preview&&<div className="flex gap-4 text-sm text-primary"><button onClick={()=>format('**','**')} disabled={generating||!!proposal}>Bold</button><button onClick={()=>format('*','*')} disabled={generating||!!proposal}>Italic</button><button onClick={()=>format('\n# ')} disabled={generating||!!proposal}>Heading</button><button onClick={()=>format('\n- ')} disabled={generating||!!proposal}>Bullet</button><button onClick={()=>format('\n> ')} disabled={generating||!!proposal}>Quote</button></div>}
    {preview?<div className="min-h-80 text-slate-200"><ManuscriptPreview content={chapter.content} format={chapter.content_format}/></div>:<textarea ref={textarea} aria-label="Chapter content" value={chapter.content} disabled={generating||!!proposal} onChange={e=>edit(e.target.value)} placeholder="Start writing your chapter here…" className="w-full min-h-[50vh] bg-black/20 rounded p-4 text-slate-200 leading-relaxed resize-y"/>}
    <p className="text-xs text-slate-400">{countWords(chapter.content,chapter.content_format)} words · Autosaves after a pause. Device drafts stay in this browser; the last 50 changed cloud versions are available in Saved history.</p>
    <details className="text-slate-300"><summary>Optional AI assistance</summary><p className="text-xs my-3">Requests send this book’s title, chapter title, tone and outline to your provider. Expand, Improve and Rephrase also send this chapter’s text. Provider charges may apply. Nothing replaces your writing until you accept.</p>{book.metadata?.bookNotes&&<label className="block text-sm my-3"><input type="checkbox" checked={includeNotes} onChange={e=>setIncludeNotes(e.target.checked)}/> Include my book notes / voice guide in this request (may increase provider usage)</label>}<div className="flex gap-3 flex-wrap">{(['write','expand','improve','rephrase'] as const).map(action=><GlassButton size="sm" key={action} disabled={generating||saving||!!conflict||!!proposal} onClick={()=>requestAI(action)}>{action==='write'?'Write w/ AI':action[0].toUpperCase()+action.slice(1)}</GlassButton>)}</div>{generating&&<p>Preparing suggestion…</p>}</details>
    {proposal&&<section className="border border-primary rounded p-4 space-y-3"><h3 className="font-bold text-white">Review AI suggestion</h3><div className="grid md:grid-cols-2 gap-4"><div><h4>Original</h4><pre className="whitespace-pre-wrap max-h-80 overflow-auto">{proposal.original||'(Empty chapter)'}</pre></div><div><h4>Proposed chapter</h4><pre className="whitespace-pre-wrap max-h-80 overflow-auto">{proposal.content}</pre></div></div><GlassButton onClick={accept}>Accept suggestion</GlassButton><GlassButton variant="secondary" onClick={()=>setProposal(null)}>Reject suggestion</GlassButton></section>}
    {history&&<section className="border border-white/10 p-4 rounded space-y-2"><h3 className="text-white font-bold">Saved history</h3><p className="text-sm">Previous cloud versions, newest first. Restoring keeps the current saved text in history.</p>{!history.length&&<p>No earlier text versions yet.</p>}{history.map(v=><button key={v.revision} onClick={()=>setRestore(v)} className="block text-primary">Version {v.revision} · {new Date(v.savedAt).toLocaleString()}</button>)}{restore&&<><ManuscriptPreview content={restore.content} format={restore.format}/><GlassButton disabled={saving||generating||!!conflict||!!proposal} onClick={async()=>{if(await save()){edit(restore.content,restore.format);setRestore(null);await save();}}}>Restore this version</GlassButton></>}<button className="text-slate-400" onClick={()=>{setHistory(null);setRestore(null);}}>Close history</button></section>}
   </>:<p className="text-slate-400">{loading?'Loading chapters…':'No chapters found. Return to the outline to add or import chapters.'}</p>}</GlassCard>
  </div>
 </div>;
}
