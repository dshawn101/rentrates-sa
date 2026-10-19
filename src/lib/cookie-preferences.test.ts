import { describe, expect, it } from 'vitest';
import { COOKIE_NOTICE_KEY, hasCurrentCookieChoice, saveNecessaryOnly } from './cookie-preferences';

describe('cookie notice acknowledgement', () => {
  const now = Date.UTC(2026, 9, 19);
  it('remembers necessary-only mode and expires it after 180 days', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) || null, setItem: (key: string, value: string) => { data.set(key, value); } };
    expect(hasCurrentCookieChoice(storage, now)).toBe(false);
    expect(saveNecessaryOnly(storage, now)).toBe(true);
    expect(hasCurrentCookieChoice(storage, now + 1000)).toBe(true);
    expect(hasCurrentCookieChoice(storage, now + 180 * 86400000)).toBe(false);
    expect(JSON.parse(data.get(COOKIE_NOTICE_KEY)!)).toEqual({ version: 1, necessaryOnly: true, savedAt: now });
  });
  it('ignores malformed, future-dated and outdated records', () => {
    for (const value of ['{', 'null', JSON.stringify({ version: 0, necessaryOnly: true, savedAt: now }), JSON.stringify({ version: 1, necessaryOnly: true, savedAt: now + 1 })]) {
      expect(hasCurrentCookieChoice({ getItem: () => value }, now)).toBe(false);
    }
  });
  it('does not crash when browser storage is blocked', () => {
    expect(hasCurrentCookieChoice({ getItem: () => { throw new Error('blocked'); } }, now)).toBe(false);
    expect(saveNecessaryOnly({ setItem: () => { throw new Error('blocked'); } }, now)).toBe(false);
  });
});
