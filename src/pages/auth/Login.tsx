import { Brand } from '../../components/ui/Brand';
import { supabaseConfigError } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../lib/supabase-config';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { WritingIllustration } from '../../components/auth/WritingIllustration';
import '../../styles/signin.css';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';

export function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (error: unknown) {
      addToast(getAuthErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="signin-page">
      <section className="signin-form-panel" aria-labelledby="signin-heading">
        <Link to="/" className="signin-brand" aria-label="PubléStudio home"><Brand /></Link>
        <div className="signin-form-content">
          <p className="signin-eyebrow">A space for your story</p>
          <h1 id="signin-heading">Welcome back<span>.</span></h1>
          <p className="signin-intro">Your words are waiting. Pick up where you left off.</p>
          {supabaseConfigError && <p role="alert" className="mb-6 text-amber-200">{supabaseConfigError}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassInput label="Email" type="email" autoComplete="username" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <GlassInput label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="signin-password-options">
                <label><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show password</label>
                <Link to="/contact">Need help signing in?</Link>
              </div>
            </div>
            <GlassButton type="submit" className="w-full py-3 text-lg" disabled={!!supabaseConfigError} isLoading={loading || isSubmitting}>Sign in</GlassButton>
          </form>
          <p className="signin-signup">New to PubléStudio? <Link to="/auth/signup">Create your account</Link></p>
        </div>
        <nav className="signin-footer" aria-label="Sign-in information"><Link to="/">Back to home</Link><Link to="/legal/privacy">Privacy</Link></nav>
      </section>
      <aside className="signin-art-panel" aria-labelledby="signin-art-heading">
        <div className="signin-art-orbit" aria-hidden="true" />
        <div className="signin-art-caption"><p className="signin-eyebrow">The author is you</p><h2 id="signin-art-heading">A world of possibilities.<br /><em>One page at a time.</em></h2></div>
        <WritingIllustration />
        <p className="signin-art-note">Your story. Your voice. Your book.</p>
      </aside>
    </main>
  );
}
