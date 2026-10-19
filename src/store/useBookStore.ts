import { create } from 'zustand';
import { bookLoadError, countWords } from '../lib/book-stats';
import { supabase } from '../lib/supabase';
import { useToastStore } from './useToastStore';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'outline' | 'writing' | 'formatting' | 'published';
  tier_created: string;
  wordCount?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface BookStore {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
  setWordCount: (id: string, count: number) => void;
  fetchBooks: () => Promise<void>;
  createBook: (title: string, metadata?: Record<string, any>) => Promise<Book | null>;
  updateBook: (id: string, changes: Partial<Pick<Book, 'title' | 'metadata' | 'status'>>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  duplicateBook: (id: string) => Promise<void>;
}

let latestBookRequest = 0;

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  isLoading: false,
  error: null,
  reset: () => { latestBookRequest++; set({ books: [], error: null, isLoading: false }); },
  setWordCount: (id, count) => set(state => ({ books: state.books.map(book => book.id === id ? { ...book, wordCount: count } : book) })),

  fetchBooks: async () => {
    const request = ++latestBookRequest;
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*, chapters(content)')
        .order('updated_at', { ascending: false });

      if (request !== latestBookRequest) return;
      if (error) throw error;
      set({ books: (data || []).map(({ chapters, ...book }) => ({
        ...book, wordCount: (chapters || []).reduce((sum: number, chapter: { content: string | null }) => sum + countWords(chapter.content), 0)
      })) });
    } catch (error: unknown) {
      if (request === latestBookRequest) set({ error: bookLoadError(error), books: [] });
    } finally {
      if (request === latestBookRequest) set({ isLoading: false });
    }
  },

  createBook: async (title, metadata = {}) => {
    set({ isLoading: true });
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('books')
        .insert([{
          title,
          user_id: userResponse.user.id,
          metadata,
          status: 'draft',
          tier_created: 'free' // Should ideally pull from profile
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ books: [data, ...state.books] }));
      useToastStore.getState().addToast('Book created successfully', 'success');
      return data;
    } catch (error: any) {
      useToastStore.getState().addToast(error.message || 'Failed to create book', 'error');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateBook: async (id, changes) => {
    const { data, error } = await supabase.from('books')
      .update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    set(state => ({ books: state.books.map(book => book.id === id ? { ...data, wordCount: book.wordCount } : book) }));
  },

  deleteBook: async (id) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;

      set((state) => ({ books: state.books.filter(b => b.id !== id) }));
      useToastStore.getState().addToast('Book deleted', 'info');
    } catch (error: any) {
      useToastStore.getState().addToast(error.message || 'Failed to delete book', 'error');
    }
  },

  duplicateBook: async (id) => {
     try {
        const bookToDuplicate = get().books.find(b => b.id === id);
        if (!bookToDuplicate) return;

        const metadata = { ...bookToDuplicate.metadata };
        delete metadata.coverPath; delete metadata.coverWidth; delete metadata.coverHeight; delete metadata.coverUrl;
        await get().createBook(`${bookToDuplicate.title} (Copy)`, metadata);
     } catch (error: any) {
         useToastStore.getState().addToast(error.message || 'Failed to duplicate book', 'error');
     }
  }
}));
