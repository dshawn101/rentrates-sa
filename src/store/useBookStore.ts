import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './useToastStore';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'outline' | 'writing' | 'formatting' | 'published';
  tier_created: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface BookStore {
  books: Book[];
  isLoading: boolean;
  fetchBooks: () => Promise<void>;
  createBook: (title: string, metadata?: Record<string, any>) => Promise<Book | null>;
  deleteBook: (id: string) => Promise<void>;
  duplicateBook: (id: string) => Promise<void>;
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  isLoading: false,

  fetchBooks: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ books: data || [] });
    } catch (error: any) {
      useToastStore.getState().addToast(error.message || 'Failed to fetch books', 'error');
    } finally {
      set({ isLoading: false });
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

        await get().createBook(`${bookToDuplicate.title} (Copy)`, bookToDuplicate.metadata);
     } catch (error: any) {
         useToastStore.getState().addToast(error.message || 'Failed to duplicate book', 'error');
     }
  }
}));
