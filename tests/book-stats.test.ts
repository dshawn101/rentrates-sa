import { expect, it } from 'vitest';
import { bookLoadError, countWords, totalBookWords } from '../src/lib/book-stats';
it('counts saved chapter text consistently, including whitespace and empty chapters', () => {
  expect(countWords('  One\n two\tthree  ')).toBe(3);
  expect(countWords(null)).toBe(0);
  expect(countWords(' ')).toBe(0);
  expect(totalBookWords([{ wordCount: 3 }, { wordCount: 2 }, {}])).toBe(5);
});
it('distinguishes a missing database schema from an empty book list', () => {
  expect(bookLoadError({ code: 'PGRST205' })).toContain('finish database setup');
  expect(bookLoadError({ code: '42P01' })).toContain('finish database setup');
  expect(bookLoadError(new Error('offline'))).toContain('retry');
});
