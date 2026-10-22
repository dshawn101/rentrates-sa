export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="puble-brand">
    <img src="/puble-quill.png" alt="" width="60" height="60" />
    {!compact && <span>Publé<span className="puble-brand-accent">Studio</span></span>}
  </span>;
}
