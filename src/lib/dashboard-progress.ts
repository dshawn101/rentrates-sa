import type { Book } from '../store/useBookStore';
export function latestSavedBook(books: Book[]): Book | undefined {
  const time = (book: Book) => Math.max(Date.parse(book.updated_at) || 0, Date.parse(book.lastEditedChapter?.updatedAt || '') || 0);
  return [...books].sort((a, b) => time(b) - time(a))[0];
}
export function progressSnapshot(book?: Book) {
  if (!book) return { project: null, nextStep: 'Create a book and give your idea a working title.' };
  const target = Number(book.metadata?.targetWordCount);
  const words = book.wordCount || 0;
  return {
    project: book.title.slice(0, 200), savedWords: words,
    targetWords: Number.isFinite(target) && target > 0 ? target : null,
    stage: book.status,
    lastChapter: book.lastEditedChapter?.title.slice(0, 200) || null,
    lastChapterSavedAt: book.lastEditedChapter?.updatedAt || null,
    nextStep: book.status === 'draft' ? 'Finish the book setup.' : book.status === 'outline' ? 'Review the outline and start a chapter.' : book.status === 'writing' ? 'Continue the latest chapter, or review what you have written.' : 'Review the saved chapters and cover before exporting a manuscript PDF.',
  };
}
