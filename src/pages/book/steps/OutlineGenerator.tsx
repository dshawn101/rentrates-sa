import { useBookStore } from '../../../store/useBookStore';
import {templateOutline,bookTemplate} from '../../../lib/book-templates';
import { ManuscriptImport } from '../../../components/book/ManuscriptImport';
import type { ContentFormat } from '../../../lib/manuscript-format';
import { useState, useEffect } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { GlassInput } from '../../../components/ui/GlassInput';

interface OutlineGeneratorProps {
  book: Book;
  onNext: () => void;
  onPrev: () => void;
  importing?: boolean;
}

interface ChapterOutline {
  id: string;
  title: string;
  description: string;
  order_index: number;
  content?: string;
  revision?: number;
  format?: ContentFormat;
  deleted_at?: string | null;
  ai_contribution?: Record<string, unknown>;
}

export function OutlineGenerator({ book, onNext, onPrev, importing=false }: OutlineGeneratorProps) {
  const { addToast } = useToastStore();
  const [outline, setOutline] = useState<ChapterOutline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [archived,setArchived] = useState<ChapterOutline[]>([]);
  const [baseline,setBaseline] = useState<ChapterOutline[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOutline();
  }, [book.id]);

  const fetchOutline = async () => {
    setIsLoading(true);
    setLoadFailed(false);
    const { data, error } = await supabase
      .from('chapters')
      .select('id,title,content,content_format,revision,deleted_at,order_index,ai_contribution')
      .eq('book_id', book.id)
      .order('order_index', { ascending: true });

    if (!error && data) {
      const rows:ChapterOutline[]=data.map(ch=>({id:ch.id,content:ch.content,format:ch.content_format,revision:ch.revision,deleted_at:ch.deleted_at,ai_contribution:ch.ai_contribution,title:ch.title,description:ch.ai_contribution?.outline_description || '',order_index:ch.order_index}));
      const active=rows.filter(ch=>!ch.deleted_at);
      setSavedIds(active.map(ch=>ch.id));setBaseline(active);setOutline(rows.length===0?templateOutline(book.metadata?.starterTemplate):active);setArchived(rows.filter(ch=>ch.deleted_at));
    }
    if (error) setLoadFailed(true);
    setIsLoading(false);
    return !error;
  };

  const addStarterOutline = async () => {
    if (!book.title || !book.metadata?.genre) {
      addToast('Please complete book setup first', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      // An editable starter template; no AI request or provider key required.

      const newOutline = [
        { id: crypto.randomUUID(), title: "Introduction: Setting the Stage", description: "Hook the reader and introduce the main concept.", order_index: 0 },
        { id: crypto.randomUUID(), title: "Chapter 1: The Inciting Incident", description: "The event that changes everything for the protagonist.", order_index: 1 },
        { id: crypto.randomUUID(), title: "Chapter 2: Rising Action", description: "Challenges and obstacles build tension.", order_index: 2 },
        { id: crypto.randomUUID(), title: "Chapter 3: The Climax", description: "The peak of the story arc.", order_index: 3 },
        { id: crypto.randomUUID(), title: "Conclusion: Resolution", description: "Tying up loose ends.", order_index: 4 },
      ];

      setOutline(prev => [...prev, ...newOutline.map((chapter, i) => ({ ...chapter, order_index: prev.length + i }))]);
      addToast('Starter chapters added. Edit them to fit your book.', 'success');
    } catch {
      addToast('Failed to generate outline', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setOutline(prev => prev.map(ch => ch.id === id ? { ...ch, title: newTitle } : ch));
  };

  const handleDescChange = (id: string, newDesc: string) => {
    setOutline(prev => prev.map(ch => ch.id === id ? { ...ch, description: newDesc } : ch));
  };

  const addChapter = () => {
    const newChapter: ChapterOutline = {
      id: crypto.randomUUID(),
      title: `Chapter ${outline.length + 1}`,
      description: "",
      order_index: outline.length
    };
    setOutline([...outline, newChapter]);
  };

  const removeChapter = (id: string) => {
    setOutline(outline.filter(ch => ch.id !== id).map((ch, idx) => ({ ...ch, order_index: idx })));
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      if (isLoading || loadFailed) return;
      if (!outline.length || outline.some(ch => !ch.title.trim())) throw new Error("Every chapter needs a title.");

      const {error}=await supabase.rpc('save_book_outline',{
        p_book:book.id,p_known_ids:savedIds,
        p_items:outline.map(ch=>({id:ch.id,title:ch.title,description:ch.description,revision:ch.revision??null,content:ch.content||'',format:ch.format||'plain'})),
        p_removed:baseline.filter(ch=>!outline.some(item=>item.id===ch.id)).map(ch=>({id:ch.id,revision:ch.revision})),
      });
      if(error)throw error;
      if(!await fetchOutline())throw new Error('Outline saved, but it could not be reloaded. Retry loading before continuing.');
      useBookStore.getState().setChapterCount(book.id,outline.length);
      addToast('Outline saved. Removed chapters are archived, not deleted.', 'success');

      await onNext();
    } catch (error: any) {
      addToast(error.message || 'Failed to save outline', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadFailed) return <GlassCard className="p-8"><p role="alert">Could not load chapters.</p><GlassButton onClick={fetchOutline}>Retry</GlassButton></GlassCard>;

  return (
    <div className="h-full overflow-y-auto pb-24 px-4 sm:px-0">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Panel */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Book Outline</h2>
              <p className="text-slate-400 text-sm">
                Define your chapters before writing. Add chapters manually or start with an editable template.
              </p>
            </div>
            <GlassButton
              disabled={isLoading || isSaving}
              onClick={addStarterOutline}
              isLoading={isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add Starter Template
            </GlassButton>
          </div>
        </GlassCard>

        <ManuscriptImport initialOpen={importing} disabled={isLoading||isSaving||loadFailed} onImport={chapters=>setOutline(prev=>[...prev,...chapters.map((ch,i)=>({id:crypto.randomUUID(),title:ch.title,content:ch.content,format:ch.format,description:'',order_index:prev.length+i}))])}/>
        {bookTemplate(book.metadata?.starterTemplate)&&savedIds.length===0&&<p className="text-sm text-purple-200 mb-4">{bookTemplate(book.metadata.starterTemplate)!.name} template · suggested titles and planning notes only. Change them freely, then save your outline. No prose is generated.</p>}
        {archived.length>0&&<details className="border border-white/10 rounded-xl p-4"><summary className="text-purple-200 cursor-pointer">Archived chapters · restore from here</summary>{archived.filter(ch=>!outline.some(item=>item.id===ch.id)).map(ch=><div key={ch.id} className="flex justify-between gap-3 mt-3"><span className="text-slate-300">{ch.title}</span><GlassButton size="sm" variant="secondary" onClick={()=>setOutline(prev=>[...prev,{...ch,deleted_at:null,order_index:prev.length}])}>Restore to outline</GlassButton></div>)}</details>}
        {/* Outline Editor */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : outline.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-dashed border-white/20 rounded-xl">
              <p className="text-slate-400 mb-4">No chapters yet. Import your draft above, use a starter template, or add one manually.</p>
              <GlassButton variant="secondary" onClick={addChapter}>
                <Plus className="w-4 h-4 mr-2" /> Add First Chapter
              </GlassButton>
            </div>
          ) : (
            outline.map((chapter, index) => (
              <GlassCard key={chapter.id} className="p-4 flex gap-4 group">
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <span className="text-xs font-bold mt-1">{index + 1}</span>
                  <button aria-label={`Move ${chapter.title} up`} disabled={index===0||isSaving} onClick={()=>setOutline(prev=>{const next=[...prev];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})} className="p-2 disabled:opacity-20">↑</button>
                  <button aria-label={`Move ${chapter.title} down`} disabled={index===outline.length-1||isSaving} onClick={()=>setOutline(prev=>{const next=[...prev];[next[index],next[index+1]]=[next[index+1],next[index]];return next;})} className="p-2 disabled:opacity-20">↓</button>
                </div>

                <div className="flex-1 space-y-3">
                  <GlassInput
                    value={chapter.title}
                    onChange={(e) => handleTitleChange(chapter.id, e.target.value)}
                    placeholder={`Chapter Title`}
                    className="font-bold text-lg bg-black/40"
                  />
                  <textarea
                    value={chapter.description}
                    onChange={(e) => handleDescChange(chapter.id, e.target.value)}
                    placeholder="Brief description of what happens in this chapter... (Used by AI for writing)"
                    className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y min-h-[60px]"
                  />
                </div>

                <div className="flex items-start">
                  <button
                    aria-label={`Remove ${chapter.title}`}
                    title="Archives this chapter when you save; it can be restored later"
                    onClick={() => removeChapter(chapter.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}

          {outline.length > 0 && (
             <button
               onClick={addChapter}
               className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
             >
               <Plus className="w-5 h-5" /> Add Chapter
             </button>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-white/10 mt-8">
          <GlassButton variant="ghost" onClick={onPrev}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Setup
          </GlassButton>

          <GlassButton onClick={handleSaveAndContinue} isLoading={isSaving} disabled={isLoading || isGenerating || outline.length === 0}>
            Save & Write Content <ArrowRight className="w-4 h-4 ml-2" />
          </GlassButton>
        </div>

      </div>
    </div>
  );
}