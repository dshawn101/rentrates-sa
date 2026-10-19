import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { displayName } from '../../lib/author-profile';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
export function DisplayNameSettings() {
  const { user, updateDisplayName } = useAuth();
  const [name, setName] = useState(displayName(user?.user_metadata?.display_name));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { await updateDisplayName(name); setName(displayName(name)); setMessage('Display name saved.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save your display name. Please try again.'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-3">
    <GlassInput label="Display name" autoComplete="nickname" maxLength={80} value={name} onChange={e => setName(e.target.value)} disabled={busy} placeholder="What should we call you?" />
    <p className="text-xs text-slate-400">We use the first word to greet you on your dashboard. Your book’s author name stays separate. Leave blank for a simple “Hello”.</p>
    <GlassButton type="submit" isLoading={busy}>Save display name</GlassButton>
    {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
  </form>;
}
