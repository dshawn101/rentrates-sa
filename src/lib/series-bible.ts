export const seriesBibleFields = [
  ['title', 'Series title'],
  ['characters', 'Characters and established facts'],
  ['changes', 'Events and changes by book'],
  ['rules', 'World rules'],
  ['threads', 'Open threads and ideas'],
] as const;

export type SeriesBibleNotes = Record<typeof seriesBibleFields[number][0], string>;

export function buildSeriesBible(notes: SeriesBibleNotes): string {
  const title = notes.title.trim().replace(/\s+/g, ' ') || 'Untitled series';
  const sections = seriesBibleFields.slice(1).map(([key, label]) =>
    `## ${label}\n\n${notes[key].trim() || '_No notes yet._'}`);
  return [`# ${title} — Series Bible`, ...sections].join('\n\n') + '\n';
}
