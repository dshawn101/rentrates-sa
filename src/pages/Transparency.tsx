import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { Link } from 'react-router-dom';
import { ShieldCheck, BarChart3, Database, Code2, ArrowLeft } from 'lucide-react';

export function Transparency() {
  return (
    <div className="min-h-screen bg-[#0f0c1b] text-slate-100 py-12 px-6">
      <Container size="md" className="space-y-8 animate-in fade-in duration-500">

        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Puble Studio
        </Link>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary">
            Radical Transparency
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We believe you deserve to know exactly how much your AI book costs to make, down to the cent. No hidden markups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">0% Platform Markup</h3>
            <p className="text-slate-400 leading-relaxed">
              We pass the exact API costs from Google Gemini and Pica directly to you. We don't make money by inflating token prices.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4 text-sm font-mono text-slate-300">
              <div className="flex justify-between mb-2">
                <span>Gemini 1.5 Pro Input</span>
                <span>$0.00125 / 1k tokens</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>OpenRouter Claude 3 Haiku</span>
                <span>$0.00025 / 1k tokens</span>
              </div>
              <div className="flex justify-between">
                <span>Pica / Image Gen</span>
                <span>$0.02 / image</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Bring Your Own Key</h3>
            <p className="text-slate-400 leading-relaxed">
              Prefer to use your own API keys? Plug them in. We store them locally on your device's browser, meaning we never see them, and you bypass our platform limits entirely. Supports Gemini, OpenRouter, and more.
            </p>
            <Link to="/profile" className="text-primary hover:text-purple-400 font-medium inline-flex items-center mt-4">
              Configure BYOK Settings →
            </Link>
          </GlassCard>

          <GlassCard className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Real-time Cost Tracking</h3>
            <p className="text-slate-400 leading-relaxed">
              Before you generate an outline or a chapter, we estimate the exact token count and cost in USD/ZAR. You'll never be surprised by a bill.
            </p>
          </GlassCard>

          <GlassCard className="p-8 space-y-4">
             <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30 mb-6">
               <Code2 className="w-6 h-6" />
             </div>
             <h3 className="text-2xl font-bold text-white">Lean Architecture</h3>
             <p className="text-slate-400 leading-relaxed">
               Built entirely on an author-centric stack (Vite + React + Supabase) tailored for speed and security, rather than VC-backed bloat.
             </p>
           </GlassCard>
        </div>

      </Container>
    </div>
  );
}