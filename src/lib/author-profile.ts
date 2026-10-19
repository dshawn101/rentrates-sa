export function displayName(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
}
export function authorFirstName(value: unknown): string {
  return displayName(value).split(' ')[0] || '';
}
