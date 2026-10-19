import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, ArrowLeft, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useBookStore } from '../../../store/useBookStore';
import type { Book } from '../../../store/useBookStore';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { COVER_BUCKET, getCoverUrl, prepareCover } from '../../../lib/covers';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
export function CoverDesigner({ book, onNext, onPrev }: { book: Book; onNext: () => void; onPrev: () => void }) {
  const { user } = useAuth(); const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<Awaited<ReturnType<typeof prepareCover>> | null>(null);
  const path = typeof book.metadata?.coverPath === 'string' ? book.metadata.coverPath : '';
  useEffect(() => {
    let active = true;
    if (pending) return;
    if (!path) { setPreview(''); return; }
    getCoverUrl(path).then(url => { if (active) setPreview(url); }).catch(() => { if (active) setError('The saved cover preview could not be loaded. Choose the image again to replace it.'); });
    return () => { active = false; };
  }, [path, pending]);
  const choose = async (file?: File) => {
    if (!file) return; setError(''); setNotice(''); setBusy(true);
    try { const prepared = await prepareCover(file); setPending(prepared); setPreview(prepared.dataUrl); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not prepare this image.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const save = async () => {
    if (!pending || !user) return;
    setBusy(true); setError('');
    const newPath = `${user.id}/${book.id}/${crypto.randomUUID()}.jpg`;
    try {
      const { error } = await supabase.storage.from(COVER_BUCKET).upload(newPath, pending.blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
      if (error) throw new Error('Cover upload failed. Check your connection and try again.');
      const latest = useBookStore.getState().books.find(item => item.id === book.id) || book;
      await useBookStore.getState().updateBook(book.id, { metadata: { ...latest.metadata, coverPath: newPath, coverWidth: pending.width, coverHeight: pending.height, coverUrl: undefined } });
      setPending(null); setNotice('Cover saved. It will be included as the first page of your PDF.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save your cover.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try {
      const latest = useBookStore.getState().books.find(item => item.id === book.id) || book;
      const metadata = { ...latest.metadata }; delete metadata.coverPath; delete metadata.coverWidth; delete metadata.coverHeight; delete metadata.coverUrl;
      await useBookStore.getState().updateBook(book.id, { metadata }); setPending(null); setPreview(''); setNotice('Cover removed from this book. Your PDF will use a title page.');
    } catch { setError('Could not remove the cover. Please retry.'); }
    finally { setBusy(false); }
  };
  return <div className="h-full overflow-y-auto pb-24"><div className="grid lg:grid-cols-[1fr_300px] gap-6 max-w-5xl mx-auto">
    <GlassCard className="p-6 md:p-8 space-y-6"><div><span className="text-xs uppercase tracking-[.2em] text-emerald-300">Make it yours</span><h2 className="text-3xl font-bold text-white mt-3">Add your cover</h2><p className="text-slate-400 mt-3">Upload a finished front cover from Canva, Midjourney, your designer, or any image editor. This step is optional.</p></div>
      <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.025] p-8 text-center space-y-4" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) void choose(e.dataTransfer.files[0]); }}>
        <Upload className="mx-auto text-emerald-300" size={30} /><p className="text-white font-medium">Drop your cover here</p><p className="text-xs text-slate-400">PNG, JPG or WebP · up to 10 MB · portrait recommended</p><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload cover image" className="sr-only" disabled={busy} onChange={e => void choose(e.target.files?.[0])} /><GlassButton variant="secondary" disabled={busy} onClick={() => input.current?.click()}>Choose image</GlassButton>
      </div>
      {pending && <div className="space-y-3"><p className="text-sm text-slate-300">Preview ready. Save this cover to use it in your book.</p>{pending.width < 1000 && <p className="text-xs text-amber-200">This image is small. A larger original will look sharper in your PDF.</p>}<GlassButton isLoading={busy} onClick={save}>Save this cover</GlassButton><GlassButton variant="ghost" disabled={busy} onClick={() => { setPending(null); setError(''); if (path) void getCoverUrl(path).then(setPreview).catch(() => setError('Could not reload the saved cover.')); else setPreview(''); }}>Cancel selection</GlassButton></div>}
      {path && !pending && <GlassButton variant="ghost" disabled={busy} onClick={remove}>Remove cover from book</GlassButton>}
      <div className="text-xs text-slate-400 space-y-2"><p>Your artwork is kept private to your account. PDF export fits the whole image without cropping or stretching. Transparency is flattened onto white.</p><p>Upload the front cover only. Printer-specific spine, back cover and bleed layouts are separate deliverables.</p></div>
      <details className="border-t border-white/10 pt-5"><summary className="text-sm text-slate-300 cursor-pointer">Need a cover design?</summary><p className="text-sm text-slate-400 mt-3">Create a design in your preferred tool, export it as PNG or JPG, then upload it here.</p><div className="flex gap-5 mt-3"><a href="https://www.canva.com/" target="_blank" rel="noreferrer" className="text-emerald-300 text-sm inline-flex gap-1 items-center">Open Canva <ExternalLink size={13} /></a><a href="https://www.midjourney.com/" target="_blank" rel="noreferrer" className="text-emerald-300 text-sm inline-flex gap-1 items-center">Open Midjourney <ExternalLink size={13} /></a></div></details>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 text-red-200 p-4 text-sm">{error}</p>}{notice && <p role="status" className="text-emerald-200 text-sm flex items-center gap-2"><CheckCircle2 size={16} />{notice}</p>}
      <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-white/10"><GlassButton variant="secondary" disabled={busy} onClick={onPrev}><ArrowLeft size={15} />Back to chapters</GlassButton><GlassButton disabled={busy || !!pending} onClick={onNext}>{path ? 'Continue to export' : 'Continue without cover'}<ArrowRight size={15} /></GlassButton></div>
    </GlassCard>
    <div className="space-y-3"><p className="text-xs text-slate-400 uppercase tracking-widest">Cover preview</p><div className="aspect-[148/210] bg-white/[0.035] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">{preview ? <img src={preview} alt={`Front cover of ${book.title}`} className="w-full h-full object-contain" /> : <div className="p-7 text-center"><ImagePlus className="mx-auto text-slate-600" size={38} /><p className="text-white font-serif text-2xl mt-7 break-words">{book.title}</p><p className="text-slate-500 text-sm mt-4">{book.metadata?.author || 'Your author name'}</p></div>}</div><p className="text-xs text-slate-500">{pending ? 'Unsaved preview' : path ? 'Saved front cover' : 'A title page will be used until you add a cover.'}</p></div>
  </div></div>;
}
