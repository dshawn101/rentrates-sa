import { useIntegrationStore } from '../../../store/useIntegrationStore';
import { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassInput } from '../../../components/ui/GlassInput';
import { GlassSelect } from '../../../components/ui/GlassSelect';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassTextArea } from '../../../components/ui/GlassTextArea';
import { useBookStore } from '../../../store/useBookStore';
import { useToastStore } from '../../../store/useToastStore';
import type { Book } from '../../../store/useBookStore';
import { Save, ArrowRight } from 'lucide-react';

interface BookSetupProps {
  book: Book;
  onNext: () => void;
}

const GENRES = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'business', label: 'Business & Economics' },
  { value: 'fantasy', label: 'Fantasy & Sci-Fi' },
  { value: 'romance', label: 'Romance' },
  { value: 'thriller', label: 'Thriller & Mystery' },
  { value: 'childrens', label: 'Children\'s Books' },
  { value: 'self-help', label: 'Self-Help & Personal Development' },
  { value: 'biography', label: 'Biography & Memoir' },
];

const TONES = [
  { value: 'professional', label: 'Professional & Authoritative' },
  { value: 'casual', label: 'Casual & Conversational' },
  { value: 'academic', label: 'Academic & Scholarly' },
  { value: 'inspirational', label: 'Inspirational & Uplifting' },
  { value: 'dramatic', label: 'Dramatic & Suspenseful' },
  { value: 'humorous', label: 'Humorous & Witty' },
  { value: 'empathetic', label: 'Empathetic & Compassionate' },
];

export function BookSetup({ book, onNext }: BookSetupProps) {
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    title: book.title || '',
    subtitle: book.metadata?.subtitle || '',
    author: book.metadata?.author || '',
    genre: book.metadata?.genre || useIntegrationStore.getState().preferences.genre,
    targetWordCount: book.metadata?.targetWordCount || useIntegrationStore.getState().preferences.targetWordCount,
    tone: book.metadata?.tone || useIntegrationStore.getState().preferences.tone,
    synopsis: book.metadata?.synopsis || '',
    bookNotes: book.metadata?.bookNotes || '',
    bookGuide: book.metadata?.bookGuide || {voice:'',facts:'',chapterNotes:''}
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (proceed: boolean) => {
    setIsSaving(true);
    try {
      // Form validation for required fields
      if (!formData.title.trim() || !formData.author.trim() || !formData.genre) {
        throw new Error("Title, Author, and Genre are required.");
      }

      const targetWordCount = Number(formData.targetWordCount);
      if (!Number.isFinite(targetWordCount) || targetWordCount < 1000 || targetWordCount > 200000) throw new Error('Target word count must be between 1,000 and 200,000.');
      await useBookStore.getState().updateBook(book.id, {
          title: formData.title.trim(),
          metadata: {
            ...book.metadata,
            subtitle: formData.subtitle,
            author: formData.author,
            genre: formData.genre,
            targetWordCount: targetWordCount,
            tone: formData.tone,
            synopsis: formData.synopsis,
            bookNotes: formData.bookNotes,
            bookGuide: formData.bookGuide
          }
        });

      addToast('Book details saved', 'success');
      if (proceed) await onNext();
    } catch (error: any) {
      addToast(error.message || 'Failed to save book details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <div className="mb-8 border-b border-white/10 pb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Book Setup</h2>
            <p className="text-slate-400">
              Define the core metadata for your book. These details guide the AI generation process
              and will be included in the final exported manuscript.
            </p>
          </div>

          <div className="space-y-6">
            <details className="border border-white/10 rounded-xl p-4"><summary className="text-white">Optional book guide</summary><p className="text-sm text-slate-400 my-3">Keep a voice sample, character names, terminology and chapter reminders together. These are not exported. Passage editing receives them only when you check Include my book guide.</p>{([['voice','Voice preferences and writing sample'],['facts','Characters, terminology and important facts'],['chapterNotes','Chapter summaries and unresolved points']] as const).map(([field,label])=><GlassTextArea key={field} label={label} value={formData.bookGuide[field]||''} maxLength={6000} onChange={e=>setFormData(prev=>({...prev,bookGuide:{...prev.bookGuide,[field]:e.target.value}}))}/>)}</details>
            <GlassTextArea label="Book notes / voice guide (optional)" name="bookNotes" value={formData.bookNotes} onChange={handleChange} maxLength={20000} placeholder="Character details, research reminders, continuity notes or how you want your writing to sound. These notes are not exported; AI receives them only if you explicitly include them in the editor."/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput
                label="Book Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="The Great Gatsby"
                required
              />
              <GlassInput
                label="Subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="A Story of the Jazz Age"
              />
            </div>

            <GlassInput
              label="Author Name *"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="F. Scott Fitzgerald"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassSelect
                label="Primary Genre *"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                options={GENRES}
                required
              />
              <GlassSelect
                label="Tone / Style *"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                options={TONES}
                required
              />
              <GlassInput
                label="Target Word Count"
                name="targetWordCount"
                type="number"
                value={formData.targetWordCount}
                onChange={handleChange}
                min={1000}
                max={200000}
                step={1000}
              />
            </div>

            <GlassTextArea
              label="Synopsis or Core Premise"
              name="synopsis"
              value={formData.synopsis}
              onChange={handleChange}
              placeholder="Briefly describe what this book is about. The AI will use this as context for outlining and writing."
              rows={4}
            />
          </div>

          <div className="mt-10 flex justify-end gap-4 border-t border-white/10 pt-6">
            <GlassButton
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </GlassButton>
            <GlassButton
              onClick={() => handleSave(true)}
              isLoading={isSaving}
              className="w-full sm:w-auto"
            >
              Continue to Outline
              <ArrowRight className="w-4 h-4 ml-2" />
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
