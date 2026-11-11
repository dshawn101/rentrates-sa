const sections = [['characters', 'Character facts'], ['changes', 'Changes by book'], ['rules', 'World rules'], ['threads', 'Unresolved plot threads']];
export function seriesMarkdown(data) {
  if (!sections.some(([key]) => data[key]?.trim())) return '';
  const title = data.title?.trim().replace(/[\r\n]+/g, ' ') || 'Untitled series';
  return [`# ${title} — Series Bible`, ...sections.map(([key, label]) => `## ${label}\n\n${data[key]?.trim() || '_To be filled in._'}`)].join('\n\n') + '\n';
}

if (typeof document !== 'undefined') {
  const modes = document.querySelectorAll('[data-mode]');
  const show = id => {
    for (const button of modes) {
      const active = button.dataset.mode === id;
      button.setAttribute('aria-pressed', String(active));
      document.getElementById(button.dataset.mode).hidden = !active;
    }
  };
  for (const button of modes) button.addEventListener('click', () => show(button.dataset.mode));
  show('book-two-root');
  const form = document.querySelector('#notes');
  const output = document.querySelector('#output');
  const status = document.querySelector('#status');
  const copy = document.querySelector('#copy');
  const download = document.querySelector('#download');
  const counted = new Set();
  let markdown = '';
  const count = event => {
    if (!document.querySelector('#measure').checked || counted.has(event)) return;
    counted.add(event);
    void fetch('/api/series-bible-event', { method: 'POST', body: event, keepalive: true, credentials: 'omit' })
      .then(response => { if (!response.ok) counted.delete(event); })
      .catch(() => counted.delete(event));
  };
  const render = () => {
    markdown = seriesMarkdown(Object.fromEntries(new FormData(form)));
    output.textContent = markdown || 'Add a continuity note or load the example to begin.';
    copy.disabled = download.disabled = !markdown;
  };
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => { render(); count('start'); });
  document.querySelector('#example').addEventListener('click', () => {
    if ([...new FormData(form).values()].some(value => value.trim()) && !window.confirm('Replace the notes in this tab with the fictional example?')) return;
    const example = {
      title: 'The Lantern Coast', characters: '- Mara is left-handed and never learned to swim.\n- Ivo is the retired lighthouse keeper.',
      changes: '- Book 1, chapter 12: Mara gives the lighthouse key to Ivo.\n- Start of Book 2: Ivo has the key.',
      rules: '- The lantern works only below the tide line.', threads: '- Who sent the unmarked map? Resolve in Book 2.',
    };
    for (const [key, value] of Object.entries(example)) form.elements.namedItem(key).value = value;
    render(); count('start'); status.textContent = 'Fictional example loaded.';
  });
  const exported = message => { count('export'); status.textContent = message; document.querySelector('#next').hidden = false; };
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(markdown); exported('Markdown copied.'); }
    catch { status.textContent = 'Copy is unavailable here. Use Download Markdown instead.'; }
  });
  download.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([markdown], {type: 'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'series-bible.md';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    exported('Markdown download started.');
  });
  document.querySelector('#signup').addEventListener('click', () => count('signup'));

}
