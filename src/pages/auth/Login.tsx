import {ResendConfirmation} from '../../components/auth/ResendConfirmation';
import { Brand } from '../../components/ui/Brand';
import { authDestination, authPagePath } from '../../lib/auth-destination';
import { supabaseConfigError } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../lib/supabase-config';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/signin.css';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';

export function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { addToast } = useToastStore();
  const linkError = search.get('emailLink');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      addToast('Welcome back!', 'success');
      navigate(authDestination(search.get('next')), {replace:true});
    } catch (error: unknown) {
      addToast(getAuthErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !loading) return <Navigate to={authDestination(search.get('next'))} replace />;

  return (
    <main className="signin-page">
      <section className="signin-form-panel" aria-labelledby="signin-heading">
        <Link to="/" className="signin-brand" aria-label="PubléStudio home"><Brand /></Link>
        <div className="signin-form-content">
          <p className="signin-eyebrow">A space for your story</p>
          <h1 id="signin-heading">Welcome back<span>.</span></h1>
          <p className="signin-intro">{search.get('next')==='billing'?'Sign in to continue with Lite checkout. You’ll review the $9/month terms before approving payment on PayPal.':'Your words are waiting. Pick up where you left off.'}</p>
          {(linkError==='expired'||linkError==='failed')&&<section role="alert" className="mb-6 rounded-xl border border-amber-200/30 bg-amber-100/5 p-4 text-sm leading-6 text-amber-100"><h2 className="font-semibold">{linkError==='expired'?'This email link has expired or was already used.':'This email link could not be verified.'}</h2><p className="mt-2">Try signing in first. If your email is still unconfirmed, request a fresh activation email below and open the newest link.</p></section>}
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
            <GlassButton type="submit" className="w-full py-3 text-lg" disabled={!!supabaseConfigError} isLoading={loading || isSubmitting}>{search.get('next')==='billing'?'Sign in & continue':'Sign in'}</GlassButton>
          </form>
          <ResendConfirmation initialEmail={email} next={search.get('next')} expanded={linkError==='expired'||linkError==='failed'} />
          <p className="signin-signup">New to PubléStudio? <Link to={authPagePath('signup',search.get('next'))}>Create your account</Link></p>
        </div>
        <nav className="signin-footer" aria-label="Sign-in information"><Link to="/">Back to home</Link><Link to="/legal/privacy">Privacy</Link></nav>
      </section>
      <aside className="signin-art-panel" aria-labelledby="signin-art-heading">
        <div className="signin-art-orbit" aria-hidden="true" />
        <div className="signin-art-caption"><p className="signin-eyebrow">The author is you</p><h2 id="signin-art-heading">A world of possibilities.<br /><em>One page at a time.</em></h2></div>
        <img className="signin-illustration" src="/signin-books.webp" width="1400" height="788" alt="Purple books, a cup of coffee and a quill in an ink bottle. The open book reads: Keep dreaming. Keep writing." />
        <p className="signin-art-note">Your story. Your voice. Your book.</p>
      </aside>
    </main>
  );
}
