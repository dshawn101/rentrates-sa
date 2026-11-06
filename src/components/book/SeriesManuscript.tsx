import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {GlassButton} from '../ui/GlassButton';
import {GlassCard} from '../ui/GlassCard';
import {BookReview} from './BookReview';
import {useBookStore} from '../../store/useBookStore';
import {importManuscript,type ManuscriptImport} from '../../lib/manuscript-import';
import {supabase} from '../../lib/supabase';

export function SeriesManuscript(){
 const {books,fetchBooks,isLoading,error:booksError,setChapterCount}=useBookStore();
 const [bookId,setBookId]=useState(''),[draft,setDraft]=useState<ManuscriptImport|null>(null),[filename,setFilename]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[acknowledged,setAcknowledged]=useState(false);
 const [reviewOpen,setReviewOpen]=useState(false);
 const navigate=useNavigate();
 const book=books.find(b=>b.id===bookId);
 useEffect(()=>{void fetchBooks();},[fetchBooks]);

 async function loadFile(file:File|undefined){
  if(!file||busy)return;
  setError('');setDraft(null);setReviewOpen(false);setAcknowledged(false);setFilename(file.name);
  if(file.size>10*1024*1024){setError('Choose a manuscript up to 10 MB.');return;}
  setBusy(true);
  try{setDraft(await importManuscript(file.name,await file.arrayBuffer()));}
  catch(error){setError(error instanceof Error?error.message:'Could not read the draft.');}
  finally{setBusy(false);}
 }

 async function save(review=false){
  if(!book||!draft||busy||(draft.warnings.length&&!acknowledged))return;
  setBusy(true);setError('');
  try{
   const {data,error}=await supabase.from('chapters').select('id,title,revision,ai_contribution').eq('book_id',book.id).is('deleted_at',null).order('order_index',{ascending:true});
   if(error)throw error;
   const current=data||[];
   if(current.length+draft.chapters.length>500)throw new Error('This import would exceed 500 chapters. Split the manuscript into smaller projects.');
   const imported=draft.chapters.map(ch=>({id:crypto.randomUUID(),title:ch.title,content:ch.content,format:ch.format,description:''}));
   if(!imported.length)throw new Error('No chapters were found in this draft.');
   const saved=await supabase.rpc('save_book_outline',{
    p_book:book.id,p_known_ids:current.map(ch=>ch.id),p_removed:[],
    p_items:[...current.map(ch=>({id:ch.id,title:ch.title,revision:ch.revision,description:ch.ai_contribution?.outline_description||''})),...imported],
   });
   if(saved.error)throw saved.error;
   setChapterCount(book.id,current.length+imported.length);
   if(review){setDraft(null);setReviewOpen(true);return;}
   navigate(`/book/${book.id}?step=3&chapter=${imported[0].id}`);
  }catch(e){setError(e&&typeof e==='object'&&'message' in e?String(e.message):'Could not save the draft. Your preview is still here; try again.');}
  finally{setBusy(false);}
 }

 return <GlassCard className="space-y-4 p-5 sm:p-6">
  <h2 className="text-xl font-semibold text-white">Continue an existing manuscript</h2>
  <p className="text-sm text-slate-300">Choose a book, upload your draft, then choose whether to start writing or review the saved book. Imported chapters are added after your existing chapters.</p>
  {isLoading?<p role="status">Loading your books…</p>:booksError?<div><p role="alert">{booksError}</p><GlassButton onClick={()=>void fetchBooks()}>Retry loading books</GlassButton></div>:!books.length?<p className="text-sm">First, <Link className="text-purple-200 underline" to="/books">start a book in My Books</Link>, then come back here to upload your draft.</p>:<>
   <label className="block text-sm">Book<select className="mt-2 block w-full rounded-lg border border-white/20 bg-slate-900 p-3" value={bookId} disabled={busy} onChange={e=>{setBookId(e.target.value);setReviewOpen(false);setDraft(null);setFilename('');setError('');}}>
    <option value="">Choose a book</option>{books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}
   </select></label>
   {book&&<><label className="block rounded-xl border border-dashed border-purple-300/40 p-4 text-sm" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void loadFile(e.dataTransfer.files[0]);}}>Manuscript file <span className="text-slate-400">(drop or choose a DOCX, TXT or Markdown file · up to 10 MB)</span>
    <input className="mt-2 block w-full text-sm" type="file" accept=".docx,.txt,.md" disabled={busy} onChange={e=>{
     const input=e.currentTarget;void loadFile(input.files?.[0]);input.value='';
    }}/>
   </label>
   {draft&&<div className="space-y-3 rounded-xl border border-white/10 p-4">
    <p className="break-words font-medium">{filename} · {draft.chapters.length} {draft.chapters.length===1?'chapter':'chapters'}</p>
    <details open><summary>Preview chapters</summary><ol className="my-3 max-h-40 list-decimal overflow-auto pl-6 text-sm">{draft.chapters.map((chapter,i)=><li key={i}>{chapter.title}</li>)}</ol><p className="whitespace-pre-wrap break-words text-sm">{draft.chapters[0]?.content.slice(0,600)}</p></details>
    {draft.chapters.length===1&&<p className="text-sm text-amber-200">Only one chapter was detected. Check whether your original uses recognizable chapter headings.</p>}
    {draft.warnings.length>0&&<><ul className="list-disc pl-5 text-sm text-amber-200">{draft.warnings.map(w=><li key={w}>{w}</li>)}</ul><label className="flex gap-2 text-sm"><input type="checkbox" checked={acknowledged} disabled={busy} onChange={e=>setAcknowledged(e.target.checked)}/> I reviewed the import limitations.</label></>}
    <div className="flex flex-wrap gap-3"><GlassButton isLoading={busy} disabled={busy||!!(draft.warnings.length&&!acknowledged)} onClick={()=>void save()}>Import and start writing</GlassButton><GlassButton disabled={busy||!!(draft.warnings.length&&!acknowledged)} onClick={()=>void save(true)}>Import and review</GlassButton></div>
    <p className="text-sm text-slate-400">Import and review saves your chapters first, then opens review options for the entire saved book. You’ll see the allowance and confirm separately before any text is sent to AI.</p>
   </div>}
   {busy&&!draft&&<p role="status">Reading your draft…</p>}
   <BookReview key={book.id} book={book} openForImport={reviewOpen}/>
   </>}
  </>}
  {error&&<p role="alert" className="text-amber-200">{error}</p>}
 </GlassCard>;
}
