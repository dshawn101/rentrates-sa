import {plainManuscript} from './manuscript-format';
import type {ContentFormat} from './manuscript-format';
export function countWords(content: string | null | undefined, format:ContentFormat='plain'): number {
  return plainManuscript(content||'',format).trim().split(/\s+/).filter(Boolean).length;
}

export function totalBookWords(books: { wordCount?: number }[]): number {
  return books.reduce((sum, book) => sum + (book.wordCount || 0), 0);
}

export function bookLoadError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (['PGRST205', '42P01'].includes(code)) return 'Book storage is not set up yet. The site administrator needs to finish database setup before you can create books.';
  return 'Could not load your books. Please retry. Your saved work has not been changed.';
}
