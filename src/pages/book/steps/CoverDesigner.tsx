import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';

export function CoverDesigner({ book, onNext, onPrev }: { book: Book; onNext: () => void; onPrev: () => void }) {
  return <GlassCard className="p-8 space-y-6">
    <h2 className="text-2xl font-bold text-white">Manuscript cover</h2>
    <p className="text-slate-300">{book.title} will export with a title page showing your title and author. Custom cover design is not available in this MVP.</p>
    <div className="flex justify-between gap-4">
      <GlassButton variant="secondary" onClick={onPrev}>Back to chapters</GlassButton>
      <GlassButton onClick={onNext}>Continue to export</GlassButton>
    </div>
  </GlassCard>;
}
