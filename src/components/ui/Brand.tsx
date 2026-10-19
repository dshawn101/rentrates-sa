export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="puble-brand">
    <img src="/puble-quill.svg" alt="" width="40" height="40" />
    {!compact && <span>Puble<span className="puble-brand-accent">Studio</span></span>}
  </span>;
}
