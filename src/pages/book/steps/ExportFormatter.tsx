import { useState } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassInput } from '../../../components/ui/GlassInput';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { readCoverForPDF } from '../../../lib/covers';
import { useAuth } from '../../../hooks/useAuth';
import type { ContentFormat } from '../../../lib/manuscript-format';
const formats=[{id:'docx',title:'Word document (.docx)',description:'Recommended for editing or sharing with your editor. Basic formatting; text only.'},{id:'pdf',title:'PDF manuscript',description:'A5 reading copy with an optional cover. Check printer requirements before publishing.'},{id:'epub',title:'EPUB ebook',description:'Reflowable ebook with a contents page and optional cover. Preview in your ebook reader.'},{id:'txt',title:'Plain text (.txt)',description:'Portable UTF-8 text backup. Formatting and covers are omitted.'},{id:'md',title:'Markdown (.md)',description:'Text backup retaining basic Markdown markup. Covers are omitted.'}] as const;
type Format=typeof formats[number]['id'];
export function ExportFormatter({book,onPrev}:{book:Book;onPrev:()=>void}) {
 const {addToast}=useToastStore(),{profile}=useAuth();
 const [format,setFormat]=useState<Format>('docx'),[isbn,setIsbn]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const download=async()=>{
  setBusy(true);setStatus('Preparing saved chapters…');
  try{
   const {data,error}=await supabase.from('chapters').select('id,title,content,content_format,deleted_at,order_index').eq('book_id',book.id).order('order_index',{ascending:true});
   if(error)throw error;
   const chapters=(data||[]).filter(c=>!c.deleted_at&&c.content?.trim()).map(c=>({title:c.title,content:c.content,format:(c.content_format||'plain') as ContentFormat}));
   if(!chapters.length)throw new Error('Write and save at least one chapter before exporting.');
   const cover=(format==='pdf'||format==='epub')&&book.metadata?.coverPath?await readCoverForPDF(book.metadata.coverPath,Number(book.metadata.coverWidth),Number(book.metadata.coverHeight)):undefined;
   const payload={title:book.title,author:book.metadata?.author||'Unknown',chapters,isbn,cover};
   const exports=await import('../../../lib/export');
   if(format==='pdf')await exports.exportToPDF(payload,profile?.tier||'free');
   else if(format==='docx')await exports.exportToDOCX(payload);
   else if(format==='epub')await exports.exportToEPUB(payload);
   else if(format==='md')await exports.exportToMarkdown(payload);
   else await exports.exportToTXT(payload);
   setStatus(`${format.toUpperCase()} prepared: ${chapters.length} chapters.`);addToast('Your manuscript download is ready.','success');
  }catch(e){setStatus('');addToast(e instanceof Error?e.message:'Export failed. Please retry.','error');}finally{setBusy(false);}
 };
 return <div className="max-w-4xl mx-auto px-4 pb-24"><GlassCard className="p-6 md:p-8 space-y-6"><h2 className="text-3xl font-bold text-white">Export your manuscript</h2><p className="text-slate-300">Your writing stays portable. Choose an editable document, ebook or reading copy.</p><div className="grid md:grid-cols-2 gap-6"><section className="space-y-4"><h3 className="text-white font-bold">{book.title}</h3><p className="text-slate-300">By {book.metadata?.author||'Unknown author'}</p><GlassInput label="ISBN (optional)" value={isbn} onChange={e=>setIsbn(e.target.value)} placeholder="Leave blank if not assigned"/><p className="text-sm text-slate-400">Downloads use cloud-saved text in chapter order. Archived and empty chapters are omitted. Return to the editor to save any outstanding changes first.</p><p className="text-sm text-slate-400">Basic headings, paragraphs, bold and italic transfer to DOCX and EPUB. Complex layouts, images inside chapters, comments, footnotes and tracked changes are not supported. PDF is a manuscript reading copy, not a validated print-ready file.</p></section><section className="space-y-3" aria-label="Export format">{formats.map(f=><button key={f.id} disabled={busy} onClick={()=>setFormat(f.id)} aria-pressed={format===f.id} className={`w-full text-left p-4 border rounded-xl ${format===f.id?'bg-primary/20 border-primary text-white':'border-white/10 text-slate-300'}`}><span className="block font-semibold">{f.title}</span><small className="text-slate-400">{f.description}</small></button>)}</section></div><GlassButton onClick={download} isLoading={busy}>Download {format.toUpperCase()}</GlassButton><p role="status" className="text-slate-300">{status}</p><GlassButton variant="secondary" disabled={busy} onClick={onPrev}>Back to Cover Design</GlassButton></GlassCard></div>;
}
