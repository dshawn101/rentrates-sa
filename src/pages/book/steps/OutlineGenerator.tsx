import { useState, useEffect } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { Sparkles, ArrowRight, ArrowLeft, GripVertical, Plus, Trash2, Loader2 } from 'lucide-react';
import { GlassInput } from '../../../components/ui/GlassInput';

interface OutlineGeneratorProps {
  book: Book;
  onNext: () => void;
  onPrev: () => void;
}

interface ChapterOutline {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

export function OutlineGenerator({ book, onNext, onPrev }: OutlineGeneratorProps) {
  const { addToast } = useToastStore();
  const [outline, setOutline] = useState<ChapterOutline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOutline();
  }, [book.id]);

  const fetchOutline = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setOutline(data.map(ch => ({
        id: ch.id,
        title: ch.title,
        description: ch.ai_contribution?.outline_description || '',
        order_index: ch.order_index
      })));
    }
    setIsLoading(false);
  };

  const generateAIOutline = async () => {
    if (!book.title || !book.metadata?.genre) {
      addToast('Please complete book setup first', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      // Phase 7 placeholder: Call Gemini API here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

      const newOutline = [
        { id: crypto.randomUUID(), title: "Introduction: Setting the Stage", description: "Hook the reader and introduce the main concept.", order_index: 0 },
        { id: crypto.randomUUID(), title: "Chapter 1: The Inciting Incident", description: "The event that changes everything for the protagonist.", order_index: 1 },
        { id: crypto.randomUUID(), title: "Chapter 2: Rising Action", description: "Challenges and obstacles build tension.", order_index: 2 },
        { id: crypto.randomUUID(), title: "Chapter 3: The Climax", description: "The peak of the story arc.", order_index: 3 },
        { id: crypto.randomUUID(), title: "Conclusion: Resolution", description: "Tying up loose ends.", order_index: 4 },
      ];

      setOutline(newOutline);
      addToast('AI Outline Generated!', 'success');
    } catch (error) {
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
      // Simple sync: Delete existing, insert new for this prototype to maintain order_index easily
      // In production, an upsert or more careful diff logic would be better.
      const { error: delError } = await supabase.from('chapters').delete().eq('book_id', book.id);
      if (delError) throw delError;

      if (outline.length > 0) {
        const { error: insError } = await supabase.from('chapters').insert(
          outline.map(ch => ({
            book_id: book.id,
            title: ch.title,
            content: '', // Start empty
            order_index: ch.order_index,
            ai_contribution: { outline_description: ch.description }
          }))
        );
        if (insError) throw insError;
      }

      addToast('Outline saved successfully', 'success');
      onNext();
    } catch (error: any) {
      addToast(error.message || 'Failed to save outline', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24 px-4 sm:px-0">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Panel */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Book Outline</h2>
              <p className="text-slate-400 text-sm">
                Define your chapters before writing. Use AI to brainstorm a structure based on your synopsis.
              </p>
            </div>
            <GlassButton
              onClick={generateAIOutline}
              isLoading={isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </GlassButton>
          </div>
        </GlassCard>

        {/* Outline Editor */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : outline.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-dashed border-white/20 rounded-xl">
              <p className="text-slate-400 mb-4">No chapters yet. Generate an outline or add one manually.</p>
              <GlassButton variant="secondary" onClick={addChapter}>
                <Plus className="w-4 h-4 mr-2" /> Add First Chapter
              </GlassButton>
            </div>
          ) : (
            outline.map((chapter, index) => (
              <GlassCard key={chapter.id} className="p-4 flex gap-4 group">
                <div className="flex flex-col items-center justify-center text-slate-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors">
                  <GripVertical className="w-5 h-5" />
                  <span className="text-xs font-bold mt-1">{index + 1}</span>
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

          <GlassButton onClick={handleSaveAndContinue} isLoading={isSaving} disabled={outline.length === 0}>
            Save & Write Content <ArrowRight className="w-4 h-4 ml-2" />
          </GlassButton>
        </div>

      </div>
    </div>
  );
}