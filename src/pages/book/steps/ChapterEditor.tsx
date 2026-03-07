import { useState, useEffect } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { FileText, Save, Play, ChevronRight, Loader2, ArrowLeft, ArrowRight, Wand2, Lightbulb, RefreshCcw } from 'lucide-react';
import { MultiProviderAI } from '../../../lib/ai-provider';
import { cn } from '../../../lib/utils';

interface ChapterEditorProps {
  book: Book;
  onNext: () => void;
  onPrev: () => void;
}

export function ChapterEditor({ book, onNext, onPrev }: ChapterEditorProps) {
  const { addToast } = useToastStore();
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchChapters();
  }, [book.id]);

  const fetchChapters = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', book.id)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setChapters(data);
      if (data.length > 0 && !selectedChapterId) {
        setSelectedChapterId(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const handleContentChange = (content: string) => {
    setChapters(prev => prev.map(ch => ch.id === selectedChapterId ? { ...ch, content } : ch));
  };

  const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);

  const handleSave = async () => {
    if (!selectedChapterId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ content: selectedChapter?.content || '' })
        .eq('id', selectedChapterId);

      if (error) throw error;
      addToast('Chapter saved successfully', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to save chapter', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const generateChapterAI = async () => {
    if (!selectedChapter) return;
    setIsGenerating(true);
    try {
      const prompt = `Write a chapter titled "${selectedChapter.title}". Tone: ${book.metadata?.tone}. Outline: ${selectedChapter.ai_contribution?.outline_description}. Output exactly 500 words.`;

      // Use the Multi-Provider AI Fallback
      const { text, providerUsed } = await MultiProviderAI.generate(prompt);

      const newContent = `${selectedChapter.content ? selectedChapter.content + '\n\n' : ''}${text}`;
      handleContentChange(newContent);

      addToast(`Chapter generated via ${providerUsed.toUpperCase()}!`, 'success');

      // Auto-save generated content
      await supabase.from('chapters').update({ content: newContent }).eq('id', selectedChapterId);

    } catch (error: any) {
      addToast(error.message || 'Failed to generate chapter', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const coPilotAction = async (action: 'expand' | 'improve' | 'rephrase') => {
    if (!selectedChapter?.content) {
       addToast("You need some content first before using Co-Pilot.", "info");
       return;
    }

    setIsGenerating(true);
    try {
      const promptMap = {
         expand: `Expand on the following text, adding more descriptive detail and narrative depth: \n\n${selectedChapter.content.slice(-1000)}`,
         improve: `Edit the following text for better flow, grammar, and emotional impact: \n\n${selectedChapter.content}`,
         rephrase: `Rewrite the following text in a slightly different style: \n\n${selectedChapter.content.slice(-500)}`
      };

      const { text, providerUsed } = await MultiProviderAI.generate(promptMap[action], { provider: 'openrouter' }); // Try openrouter first for these actions if available

      let newContent = selectedChapter.content;
      if (action === 'expand') newContent += `\n\n${text}`;
      else newContent = text; // replace for improve/rephrase

      handleContentChange(newContent);
      addToast(`Content ${action}ed via ${providerUsed.toUpperCase()}`, 'success');
      await supabase.from('chapters').update({ content: newContent }).eq('id', selectedChapterId);

    } catch (error: any) {
      addToast(error.message || `Failed to ${action} content.`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden pb-24 px-4 sm:px-0 max-w-7xl mx-auto">

      {/* Sidebar: Chapter List */}
      <div className="w-full md:w-1/3 lg:w-1/4 h-1/3 md:h-[calc(100vh-14rem)] flex flex-col gap-4">
        <GlassCard className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-lg font-bold text-white mb-4 px-2">Chapters</h3>

          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : chapters.length === 0 ? (
             <p className="text-slate-500 text-sm px-2">No chapters found. Go back and generate an outline.</p>
          ) : (
            chapters.map((chapter, idx) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapterId(chapter.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors",
                  selectedChapterId === chapter.id
                    ? "bg-primary/20 text-white border border-primary/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  chapter.content ? "bg-emerald-500/20 text-emerald-400" : "bg-black/40 text-slate-500"
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{chapter.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {chapter.content ? `${chapter.content.split(' ').length} words` : 'Empty'}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  selectedChapterId === chapter.id ? "text-primary opacity-100" : "opacity-0"
                )} />
              </button>
            ))
          )}
        </GlassCard>

        {/* Global actions */}
        <div className="flex flex-col gap-2 shrink-0">
           <GlassButton variant="secondary" onClick={onPrev} className="w-full justify-center">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Outline
           </GlassButton>
           <GlassButton onClick={onNext} className="w-full justify-center">
             Design Cover <ArrowRight className="w-4 h-4 ml-2" />
           </GlassButton>
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="w-full md:w-2/3 lg:w-3/4 h-2/3 md:h-[calc(100vh-14rem)] flex flex-col">
        {selectedChapter ? (
          <GlassCard className="flex-1 flex flex-col min-h-0 relative">

            {/* Editor Toolbar */}
            <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-black/20 shrink-0">
              <div className="flex items-center gap-2 max-w-[50%]">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-bold text-white truncate text-sm">{selectedChapter.title}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="h-8 px-3 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" /> Save
                </GlassButton>
                <GlassButton
                  size="sm"
                  onClick={generateChapterAI}
                  isLoading={isGenerating}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500 to-indigo-600"
                >
                  <Play className="w-3 h-3 mr-1" /> Write w/ AI
                </GlassButton>
              </div>
            </div>

            {/* Co-Pilot Action Bar */}
            <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-between shrink-0">
               {selectedChapter.ai_contribution?.outline_description ? (
                 <span className="text-xs text-purple-200/70 truncate mr-4">
                   <strong>Outline Context:</strong> {selectedChapter.ai_contribution.outline_description}
                 </span>
               ) : <span className="text-xs text-slate-500">No outline context set.</span>}

               <div className="flex gap-2">
                 <button onClick={() => coPilotAction('expand')} disabled={isGenerating} className="text-xs text-primary hover:text-purple-300 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <Wand2 className="w-3 h-3" /> Expand
                 </button>
                 <button onClick={() => coPilotAction('improve')} disabled={isGenerating} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <Lightbulb className="w-3 h-3" /> Improve
                 </button>
                 <button onClick={() => coPilotAction('rephrase')} disabled={isGenerating} className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <RefreshCcw className="w-3 h-3" /> Rephrase
                 </button>
               </div>
            </div>

            {/* Text Area */}
            <textarea
              value={selectedChapter.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your chapter here, or click 'Write w/ AI' to let Gemini draft it based on your outline..."
              className="flex-1 w-full bg-transparent border-none p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-0 resize-none font-sans leading-relaxed text-base md:text-lg"
              spellCheck="false"
            />

            {/* Word Count Footer */}
            <div className="h-8 border-t border-white/5 bg-black/40 px-4 flex items-center justify-end shrink-0">
               <span className="text-xs text-slate-500">
                 {selectedChapter.content ? selectedChapter.content.split(/\s+/).filter(Boolean).length : 0} words
               </span>
            </div>

          </GlassCard>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a chapter from the sidebar to start writing.</p>
          </div>
        )}
      </div>

    </div>
  );
}