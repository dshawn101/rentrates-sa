import { create } from 'zustand';

interface OutlineItem {
  title: string;
  summary: string;
  content?: string;
}

interface BookState {
  id: string | null;
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  tone: string;
  wordCountTarget: number;
  outline: OutlineItem[];
  coverUrl: string | null;

  // Actions
  updateMetadata: (data: Partial<BookState>) => void;
  setOutline: (outline: OutlineItem[]) => void;
  updateChapterContent: (index: number, content: string) => void;
  setCover: (url: string) => void;
  reset: () => void;
}

export const useBookStore = create<BookState>((set) => ({
  id: null,
  title: '',
  subtitle: '',
  author: '',
  genre: 'Fiction',
  tone: 'Professional',
  wordCountTarget: 50000,
  outline: [],
  coverUrl: null,

  updateMetadata: (data) => set((state) => ({ ...state, ...data })),
  setOutline: (outline) => set({ outline }),
  updateChapterContent: (index, content) =>
    set((state) => {
      const newOutline = [...state.outline];
      newOutline[index] = { ...newOutline[index], content };
      return { outline: newOutline };
    }),
  setCover: (coverUrl) => set({ coverUrl }),
  reset: () => set({
    id: null, title: '', subtitle: '', author: '', genre: 'Fiction', tone: 'Professional',
    wordCountTarget: 50000, outline: [], coverUrl: null
  }),
}));
