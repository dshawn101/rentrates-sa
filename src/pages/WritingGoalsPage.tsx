import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useBookStore} from '../store/useBookStore';
import {latestSavedBook} from '../lib/dashboard-progress';
import {WritingGoals} from '../components/author/WritingGoals';
import {Container} from '../components/layout/Container';
import {GlassButton} from '../components/ui/GlassButton';
export function WritingGoalsPage(){
 const {books,isLoading,error,fetchBooks}=useBookStore();const [search]=useSearchParams();const [selected,setSelected]=useState(()=>search.get('book')||'');
 const book=books.find(b=>b.id===selected)||latestSavedBook(books);
 return <Container className="py-4 space-y-6"><header><p className="text-xs uppercase tracking-widest text-purple-200 mb-3">Your pace. Your progress.</p><h1 className="text-3xl font-semibold text-white">Writing Goals</h1><p className="text-slate-400 mt-3 leading-7">Choose a manuscript and give yourself an optional word target. Goals stay here so your editing space stays focused on the writing.</p></header>
 {error?<section className="rounded-xl border border-white/15 p-6 space-y-4"><p role="alert">Your manuscripts could not be loaded. Saved goals have not changed.</p><GlassButton onClick={()=>void fetchBooks()}>Retry loading manuscripts</GlassButton></section>:isLoading?<p role="status">Loading manuscripts and goals…</p>:book?<section className="author-goals-workspace"><label className="author-goals-selector">Manuscript<select value={book.id} onChange={e=>setSelected(e.target.value)}>{books.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}</select></label><WritingGoals key={book.id} book={book} expanded/><Link className="text-purple-200 text-sm underline underline-offset-4" to={`/book/${encodeURIComponent(book.id)}?step=3`}>Continue writing in {book.title} →</Link></section>:<section className="rounded-xl border border-white/15 p-6 space-y-4"><h2 className="text-xl text-white">Give your first book a home.</h2><p className="text-slate-400">Create or import a manuscript, then return here to set a goal whenever you’re ready.</p><Link className="glass-button inline-flex" to="/books">Open My Books</Link></section>}
 </Container>;
}
