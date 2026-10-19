export const COOKIE_NOTICE_KEY = 'puble:cookie-notice:v1';
export const COOKIE_NOTICE_EVENT = 'puble:cookie-settings';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function hasCurrentCookieChoice(storage: Pick<Storage, 'getItem'>, now = Date.now()): boolean {
  try {
    const value = JSON.parse(storage.getItem(COOKIE_NOTICE_KEY) || 'null');
    return value?.version === 1 && value?.necessaryOnly === true &&
      typeof value.savedAt === 'number' && value.savedAt <= now && now - value.savedAt < MAX_AGE;
  } catch { return false; }
}

export function saveNecessaryOnly(storage: Pick<Storage, 'setItem'>, now = Date.now()): boolean {
  try {
    storage.setItem(COOKIE_NOTICE_KEY, JSON.stringify({ version: 1, necessaryOnly: true, savedAt: now }));
    return true;
  } catch { return false; }
}
