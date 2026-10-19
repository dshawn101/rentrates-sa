import { expect, it } from 'vitest';
import { fitCover, validateCoverFile } from '../src/lib/covers';
it('rejects oversized and active/non-image files before upload', () => {
  for (const type of ['image/svg+xml', 'text/html', 'application/pdf', '']) expect(() => validateCoverFile({ size: 1000, type })).toThrow();
  expect(() => validateCoverFile({ size: 11 * 1024 * 1024, type: 'image/png' })).toThrow();
  expect(() => validateCoverFile({ size: 0, type: 'image/png' })).toThrow();
  expect(() => validateCoverFile({ size: 1000, type: 'image/png' })).not.toThrow();
});
it('fits wide and tall covers without cropping or stretching', () => {
  const wide = fitCover(2000, 1000); const tall = fitCover(1000, 2000);
  expect(wide.width / wide.height).toBe(2); expect(wide.width).toBe(148); expect(wide.y).toBeGreaterThan(0);
  expect(tall.height).toBe(210); expect(tall.x).toBeGreaterThan(0);
});
