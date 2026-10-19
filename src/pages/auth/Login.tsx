import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { Link, useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      addToast(error.message || 'Failed to login', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0f0c1b]" />
      <div className="absolute -top-[40%] -right-[40%] w-full h-full bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[40%] -left-[40%] w-full h-full bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-slate-400 text-lg">Sign in to continue to Puble Studio</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-300">
                <input type="checkbox" className="mr-2 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-slate-950" />
                Remember me
              </label>
              <a href="#" className="text-primary hover:text-purple-400 font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            <GlassButton type="submit" className="w-full py-3 text-lg" isLoading={loading}>
              Sign in
            </GlassButton>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary hover:text-purple-400 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
