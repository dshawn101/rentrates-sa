import {ResendConfirmation} from '../../components/auth/ResendConfirmation';
import {authDestination,authPagePath} from '../../lib/auth-destination';
import { Brand } from '../../components/ui/Brand';
import { supabaseConfigError } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../lib/supabase-config';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';

export function Signup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading, user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const billing = search.get('next') === 'billing';
  const checkEmail = search.get('checkEmail') === '1';
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(email, password, billing ? 'billing' : undefined);
      if (result.requiresConfirmation) {
        setPassword('');setConfirmPassword('');
        navigate(authPagePath('signup', search.get('next'), true), {replace:true});
      } else {
        navigate(authDestination(search.get('next')), {replace:true});
      }
    } catch (error: unknown) {
      addToast(getAuthErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !loading) return <Navigate to={authDestination(search.get('next'))} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0f0c1b]" />
      <div className="absolute -top-[40%] -right-[40%] w-full h-full bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[40%] -left-[40%] w-full h-full bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex mb-6" aria-label="PubléStudio home"><Brand /></Link>
          <h1 className="text-slate-400 text-lg font-normal tracking-normal">{checkEmail?'Check your email':billing?'Create your account to continue with Lite checkout':'Create your account to start writing'}</h1>
          {billing && !checkEmail && <p className="text-sm text-slate-400 mt-3 leading-6">Your account links Lite to your books. Review the $9/month terms before approving payment on PayPal.</p>}
        </div>

        <GlassCard className="p-8">
          {supabaseConfigError && <p role="alert" className="mb-6 text-amber-200">{supabaseConfigError}</p>}
          <div hidden={checkEmail}><form onSubmit={handleSubmit} className="space-y-6">
            <GlassInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <GlassInput
              label="Password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <GlassInput
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="text-sm text-slate-400 leading-relaxed">
              By signing up, you agree to our{' '}
              <Link to="/legal/terms" className="text-primary hover:text-purple-400 transition-colors">Terms & Conditions</Link> and{' '}
              <Link to="/legal/privacy" className="text-primary hover:text-purple-400 transition-colors">Privacy Policy</Link>.
            </div>

            <GlassButton type="submit" className="w-full py-3 text-lg" disabled={!!supabaseConfigError} isLoading={loading || isSubmitting}>
              {billing?'Create account & continue':'Create Account'}
            </GlassButton>
          </form></div>
          {checkEmail && <section aria-label="Email confirmation next steps" className="space-y-5 text-slate-300 leading-7"><p role="status">Open the PubléStudio confirmation email and confirm your address. If you already have an account, sign in instead.</p><p>{billing?'After confirmation, continue to Lite checkout to review the $9/month subscription and approve it on PayPal. Creating an account does not start a paid subscription.':'After confirmation, sign in to open your writing space.'}</p><p className="text-sm text-slate-400">Check your spam folder if the message is missing. You can return here after confirming on another device. Use the newest email; older links may be expired or already used.</p><ResendConfirmation initialEmail={email} next={search.get('next')} /><Link className="glass-button inline-flex" to={authPagePath('login', search.get('next'))}>{billing?'Continue to sign in & Lite checkout':'Continue to sign in'}</Link><Link className="block text-sm text-purple-200 underline" to={authPagePath('signup',search.get('next'))}>Use a different email</Link></section>}

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to={authPagePath('login',search.get('next'))} className="text-primary hover:text-purple-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
