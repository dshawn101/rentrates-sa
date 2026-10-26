import { Link } from 'react-router-dom';
import type { BookFolder } from '../components/book/BookFolders';
import { BookFolders } from '../components/book/BookFolders';
import { useToastStore } from '../store/useToastStore';
import { supabase } from '../lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authorFirstName } from '../lib/author-profile';
import { latestSavedBook, progressSnapshot } from '../lib/dashboard-progress';
import { DashboardHelper } from '../components/dashboard/DashboardHelper';
import { useBookStore } from '../store/useBookStore';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { BookCard } from '../components/book/BookCard';
import { GlassButton } from '../components/ui/GlassButton';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassInput } from '../components/ui/GlassInput';

export function MyBooks(){const {user}=useAuth();return <MyBookLibrary key={user?.id}/>;}
function MyBookLibrary() {
  const { books, isLoading, error, fetchBooks, createBook, deleteBook, duplicateBook } = useBookStore();
  const navigate = useNavigate();
  const active=useRef(true);useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const [folder,setFolder]=useState('all');
  const [folders,setFolders]=useState<BookFolder[]>([]);
  const [search,setSearch]=useState('');
  const [moving,setMoving]=useState(false);
  const {addToast}=useToastStore();
  const { user } = useAuth();
  const firstName = authorFirstName(user?.user_metadata?.display_name);
  const latestBook = latestSavedBook(books);
  const progress = progressSnapshot(latestBook);
  useEffect(() => { void fetchBooks(); }, [fetchBooks]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [startMode,setStartMode]=useState<'new'|'import'>('new');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setIsCreating(true);
    const newBook = await createBook(newBookTitle,{},folder==='all'||folder==='unfiled'?null:folder);
    if(!active.current)return;
    setIsCreating(false);

    if (newBook) {
      setIsCreateModalOpen(false);
      setNewBookTitle('');
      navigate(`/book/${newBook.id}${startMode==='import'?'?intent=import':''}`);
    }
  };

  const moveBook=async(id:string,target:string|null)=>{
    if(moving||!user||!books.some(b=>b.id===id))return;
    setMoving(true);
    try{
      const {data,error}=await supabase.from('books').update({folder_id:target}).eq('id',id).eq('user_id',user.id).select('id,folder_id').single();
      if(error)throw error;if(!active.current)return;if(!data)throw new Error('The manuscript could not be moved. Reload and retry.');
      useBookStore.setState(state=>({books:state.books.map(b=>b.id===id?{...b,folder_id:data.folder_id}:b)}));
      addToast(target?'Manuscript moved to folder.':'Manuscript moved to Unfiled.','success');
    }catch(e){if(active.current)addToast(e instanceof Error?e.message:(e as {message?:string}).message||'Could not move manuscript.','error');}finally{setMoving(false);}
  };
  const visibleBooks=books.filter(b=>(folder==='all'||(folder==='unfiled'?!b.folder_id:b.folder_id===folder))&&b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Container className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            My Books
          </h1>
          <p className="text-slate-400 mt-1">
            {error ? 'Your projects are currently unavailable.' : isLoading ? 'Loading your projects…' : `Welcome back! You have ${books.length} active projects.`}
          </p>
        </div>
        <GlassButton disabled={!!error || isLoading} onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Start new book
        </GlassButton>
      </div>

      {error && <GlassCard className="p-6 border-amber-500/30"><p role="alert" className="text-amber-200">{error}</p><GlassButton variant="secondary" onClick={fetchBooks}>Retry loading books</GlassButton></GlassCard>}

      <div className="grid gap-5">
        <GlassCard className="p-7 bg-gradient-to-br from-purple-400/[0.07] to-transparent">
          <p className="text-xs text-purple-300 uppercase tracking-[.18em]">Your next chapter</p>
          <h2 className="text-2xl font-semibold text-white mt-3">{error ? 'Progress unavailable' : isLoading ? 'Checking your saved progress…' : latestBook ? 'Pick up where you left off' : 'Start with an idea'}</h2>
          {!error && !isLoading && <>
            <p className="text-sm text-slate-300 mt-3">{latestBook?.title || 'Plan chapters, write at your pace, and bring your own cover.'}</p>
            {latestBook && <div className="space-y-2 mt-4 text-sm text-slate-400">
              <p>{(progress.savedWords || 0).toLocaleString()} saved words{progress.targetWords ? ` of ${progress.targetWords.toLocaleString()} target` : ''}</p>
              {progress.targetWords && <progress aria-label="Book word target progress" className="w-full h-2 accent-purple-400" value={Math.min(progress.savedWords || 0, progress.targetWords)} max={progress.targetWords} />}
              {latestBook.lastEditedChapter ? <p>Last chapter saved: <span className="text-slate-200">{latestBook.lastEditedChapter.title}</span> · <time dateTime={latestBook.lastEditedChapter.updatedAt}>{new Date(latestBook.lastEditedChapter.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></p> : <p>No saved chapter text yet.</p>}
              <p>{progress.nextStep}</p>
            </div>}
          </>}
          <div className="flex flex-wrap gap-4 mt-5">{!error && !isLoading && latestBook && <Link to={`/book/${latestBook.id}?step=${latestBook.lastEditedChapter ? 3 : latestBook.status === 'draft' ? 1 : latestBook.status === 'outline' ? 2 : latestBook.status === 'writing' ? 3 : 5}${latestBook.lastEditedChapter?'&chapter='+encodeURIComponent(latestBook.lastEditedChapter.id):''}`} className="glass-button inline-flex">Continue writing</Link>}<GlassButton variant="secondary" disabled={!!error || isLoading} onClick={() => setIsCreateModalOpen(true)}>New book</GlassButton></div>
          <DashboardHelper key={`${user?.id}:${firstName}:${latestBook?.id}:${latestBook?.updated_at}:${latestBook?.lastEditedChapter?.updatedAt}:${latestBook?.wordCount}`} book={latestBook} firstName={firstName} unavailable={!!error || isLoading} />
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-3"><h2 className="text-xl font-semibold text-white">Where would you like to start?</h2><p className="text-sm text-slate-400">Write manually from the first word. AI setup is optional.</p><div className="flex flex-wrap gap-3"><GlassButton disabled={!!error||isLoading} onClick={()=>{setStartMode('new');setIsCreateModalOpen(true);}}>Start a book</GlassButton><GlassButton disabled={!!error||isLoading} onClick={()=>{setStartMode('import');setIsCreateModalOpen(true);}}>Import a draft</GlassButton>{latestBook&&<Link className="glass-button" to={`/book/${latestBook.id}?step=${latestBook.lastEditedChapter?3:1}`}>Continue writing</Link>}</div></GlassCard>
      <BookFolders onFolders={setFolders} userId={user?.id} books={books} selected={folder} onSelect={setFolder} onMove={moveBook} moving={moving} />

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-white">{folder==='all'?'Recent Projects':'Manuscripts'}</h2><input aria-label="Search my books" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search books by title" className="bg-black/30 border border-white/10 rounded-lg p-3 text-white"/></div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? null : visibleBooks.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/20 bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No books in this view</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Start a new book, choose another folder, or clear your search.
            </p>
            <GlassButton disabled={!!error || isLoading} onClick={() => setIsCreateModalOpen(true)}>
              Start new book
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleBooks.map((book) => (
              <BookCard
                key={book.id}
                draggable={!moving}
                onDragStart={event=>{event.dataTransfer.setData('application/x-puble-book',book.id);event.dataTransfer.effectAllowed='move';}}
                folders={folders}
                folderId={book.folder_id}
                onMove={moveBook}
                moving={moving}
                id={book.id}
                title={book.title}
                status={book.status}
                updatedAt={book.updated_at}
                wordCount={book.wordCount || 0}
                coverUrl={book.metadata?.coverUrl}
                coverPath={book.metadata?.coverPath}
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
            <h2 className="text-2xl font-bold text-white mb-2">Start new book</h2>
            <p className="text-slate-400 text-sm mb-6">Give your new book a working title. You can change this later.</p>

            <label className="block text-slate-300 mb-4">Starting point<select className="block w-full bg-slate-900 p-3 rounded mt-2" value={startMode} onChange={e=>setStartMode(e.target.value as 'new'|'import')}><option value="new">Start a new manuscript</option><option value="import">Import an existing draft after setup</option></select></label>
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
                  Create book
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </Container>
  );
}
