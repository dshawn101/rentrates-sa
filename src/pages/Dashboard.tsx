import { totalBookWords } from '../lib/book-stats';
import { useState } from 'react';
import { useBookStore } from '../store/useBookStore';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { BookCard } from '../components/book/BookCard';
import { GlassButton } from '../components/ui/GlassButton';
import { BookOpen, TrendingUp, Sparkles, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassInput } from '../components/ui/GlassInput';

export function Dashboard() {
  const { books, isLoading, error, fetchBooks, createBook, deleteBook, duplicateBook } = useBookStore();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setIsCreating(true);
    const newBook = await createBook(newBookTitle);
    setIsCreating(false);

    if (newBook) {
      setIsCreateModalOpen(false);
      setNewBookTitle('');
      navigate(`/book/${newBook.id}`);
    }
  };

  const totalWords = totalBookWords(books);

  return (
    <Container className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            {error ? 'Your projects are currently unavailable.' : isLoading ? 'Loading your projects…' : `Welcome back! You have ${books.length} active projects.`}
          </p>
        </div>
        <GlassButton disabled={!!error || isLoading} onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </GlassButton>
      </div>

      {error && <GlassCard className="p-6 border-amber-500/30"><p role="alert" className="text-amber-200">{error}</p><GlassButton variant="secondary" onClick={fetchBooks}>Retry loading books</GlassButton></GlassCard>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Projects</p>
              <h3 className="text-3xl font-bold text-white mt-2">{error ? '—' : books.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-300" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Words Written</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {error ? '—' : totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
          </div>

        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-2xl" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-400">AI Provider Costs</p>
              <h3 className="text-3xl font-bold text-white mt-2 flex items-baseline gap-1">
                Not tracked
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <p className="text-xs text-amber-200 mt-4 relative z-10">
            Optional AI requests are billed by your provider. Check its dashboard for usage.
          </p>
        </GlassCard>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Projects</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? null : books.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/20 bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Create your first book project to plan chapters, write your manuscript, and export a PDF.
            </p>
            <GlassButton disabled={!!error || isLoading} onClick={() => setIsCreateModalOpen(true)}>
              Create First Project
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                status={book.status}
                updatedAt={book.updated_at}
                wordCount={book.wordCount || 0}
                coverUrl={book.metadata?.coverUrl}
                onDelete={deleteBook}
                onDuplicate={duplicateBook}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0f0c1b]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <GlassCard className="w-full max-w-md p-6 relative z-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">New Project</h2>
            <p className="text-slate-400 text-sm mb-6">Give your new book a working title. You can change this later.</p>

            <form onSubmit={handleCreateBook} className="space-y-4">
              <GlassInput
                label="Book Title"
                placeholder="e.g., The Midnight Library"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-3 pt-4">
                <GlassButton
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  isLoading={isCreating}
                  disabled={!newBookTitle.trim() || isCreating}
                >
                  Create Project
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </Container>
  );
}
