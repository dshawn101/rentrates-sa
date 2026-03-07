import { useState, useEffect } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { Sparkles, ArrowRight, ArrowLeft, Image as ImageIcon, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { GlassInput } from '../../../components/ui/GlassInput';
import { GlassSelect } from '../../../components/ui/GlassSelect';

interface CoverDesignerProps {
  book: Book;
  onNext: () => void;
  onPrev: () => void;
}

const COVER_STYLES = [
  { value: 'minimalist', label: 'Minimalist & Clean' },
  { value: 'bold', label: 'Bold & Cinematic' },
  { value: 'fantasy', label: 'Fantasy & Magical' },
  { value: 'business', label: 'Professional Business' },
  { value: 'romance', label: 'Romance & Warm' },
  { value: 'vintage', label: 'Vintage & Retro' },
];

export function CoverDesigner({ book, onNext, onPrev }: CoverDesignerProps) {
  const { addToast } = useToastStore();
  const [covers, setCovers] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);

  useEffect(() => {
    fetchCovers();
  }, [book.id]);

  const fetchCovers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('book_covers')
      .select('*')
      .eq('book_id', book.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCovers(data);
      const selected = data.find(c => c.is_selected);
      if (selected) setSelectedCoverId(selected.id);
    }
    setIsLoading(false);
  };

  const generateCoverWithAI = async () => {
    setIsGenerating(true);
    try {
      // Phase 8 placeholder: Call Pica API here
      await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate image gen delay

      const mockCovers = [
        `https://source.unsplash.com/random/800x1200?${selectedStyle},book,cover,${book.metadata?.genre || 'abstract'}&sig=${Date.now()}`,
        `https://source.unsplash.com/random/800x1200?art,${selectedStyle},book,${book.metadata?.genre || 'abstract'}&sig=${Date.now() + 1}`,
        `https://source.unsplash.com/random/800x1200?design,${selectedStyle},book,${book.metadata?.genre || 'abstract'}&sig=${Date.now() + 2}`,
        `https://source.unsplash.com/random/800x1200?typography,${selectedStyle},book,${book.metadata?.genre || 'abstract'}&sig=${Date.now() + 3}`,
      ];

      // Save to database
      const insertData = mockCovers.map(url => ({
        book_id: book.id,
        image_url: url,
        provider: 'pica',
        is_selected: false
      }));

      const { data, error } = await supabase.from('book_covers').insert(insertData).select();

      if (error) throw error;
      if (data) setCovers(prev => [...data, ...prev]);

      addToast('4 Cover variations generated!', 'success');
    } catch (error) {
      addToast('Failed to generate covers', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCover = async (id: string, url: string) => {
    setSelectedCoverId(id);

    // Optimistic UI update
    setCovers(prev => prev.map(c => ({
      ...c,
      is_selected: c.id === id
    })));

    try {
      // 1. Deselect all others
      await supabase.from('book_covers').update({ is_selected: false }).eq('book_id', book.id);

      // 2. Select the chosen one
      await supabase.from('book_covers').update({ is_selected: true }).eq('id', id);

      // 3. Update book metadata with selected cover URL
      await supabase.from('books').update({
         metadata: { ...book.metadata, coverUrl: url }
      }).eq('id', book.id);

      addToast('Cover selected', 'success');
    } catch (error) {
      addToast('Failed to set cover', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden pb-24 px-4 sm:px-0 max-w-7xl mx-auto">

      {/* Sidebar: AI Prompt Builder */}
      <div className="w-full md:w-1/3 h-auto md:h-[calc(100vh-14rem)] flex flex-col gap-4">
        <GlassCard className="flex-1 p-6 flex flex-col min-h-0">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Cover Designer
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Generate stunning, print-ready book covers using AI. Four variations will be created based on your book's metadata.
          </p>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <GlassSelect
              label="Style Preset"
              options={COVER_STYLES}
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
            />

            <GlassInput
              label="Custom Prompt Details (Optional)"
              placeholder="e.g. A lone figure standing on a cliff..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-auto">
               <p className="text-xs text-primary mb-2 font-semibold">AI Prompt Preview:</p>
               <p className="text-xs text-purple-200/80 italic">
                 "{selectedStyle} book cover design for a {book.metadata?.genre} book titled '{book.title}' by {book.metadata?.author}. {customPrompt}"
               </p>
            </div>

            <GlassButton
              onClick={generateCoverWithAI}
              isLoading={isGenerating}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Generate 4 Variations
            </GlassButton>

            <div className="relative flex items-center py-2">
               <div className="flex-grow border-t border-white/10"></div>
               <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-medium">Or</span>
               <div className="flex-grow border-t border-white/10"></div>
            </div>

            <GlassButton variant="secondary" className="w-full justify-center">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload Custom Image
            </GlassButton>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
           <GlassButton variant="secondary" onClick={onPrev} className="flex-1 justify-center">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back
           </GlassButton>
           <GlassButton onClick={onNext} className="flex-1 justify-center" disabled={!selectedCoverId}>
             Format & Export <ArrowRight className="w-4 h-4 ml-2" />
           </GlassButton>
        </div>
      </div>

      {/* Main Area: Gallery */}
      <div className="w-full md:w-2/3 h-auto md:h-[calc(100vh-14rem)] flex flex-col">
        <GlassCard className="flex-1 p-6 min-h-0 overflow-y-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Cover Gallery</h3>
              <p className="text-sm text-slate-400">Select your favorite variation to use as the book cover.</p>
            </div>
            {selectedCoverId && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cover Selected
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : covers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-white/10 rounded-xl">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50 text-amber-500" />
              <p>No covers generated yet. Use the prompt builder to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {covers.map((cover) => (
                <div
                  key={cover.id}
                  onClick={() => handleSelectCover(cover.id, cover.image_url)}
                  className={`
                    relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 group
                    ${cover.is_selected
                      ? 'ring-4 ring-primary ring-offset-4 ring-offset-[#0f0c1b] scale-95 shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                      : 'hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-white/20'
                    }
                  `}
                >
                  <img
                    src={cover.image_url}
                    alt="Cover Option"
                    className="w-full h-full object-cover bg-black/40"
                    loading="lazy"
                  />

                  {/* Selection Overlay */}
                  <div className={`
                    absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300
                    ${cover.is_selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}>
                    {cover.is_selected ? (
                      <div className="bg-primary text-white rounded-full p-2 shadow-lg scale-in">
                         <CheckCircle2 className="w-8 h-8" />
                      </div>
                    ) : (
                      <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                        Click to Select
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

    </div>
  );
}