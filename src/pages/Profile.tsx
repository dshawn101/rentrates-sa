import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Container } from '../components/layout/Container';
import { useToastStore } from '../store/useToastStore';
import { Key, User, ShieldCheck, Mail } from 'lucide-react';

export function Profile() {
  const { user, profile } = useAuth();
  const { addToast } = useToastStore();

  const [geminiKey, setGeminiKey] = useState('');
  const [picaKey, setPicaKey] = useState('');

  useEffect(() => {
    // Load existing keys from local storage
    const savedGemini = localStorage.getItem('userGeminiKey');
    const savedPica = localStorage.getItem('userPicaKey');
    if (savedGemini) setGeminiKey(savedGemini);
    if (savedPica) setPicaKey(savedPica);
  }, []);

  const saveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey) localStorage.setItem('userGeminiKey', geminiKey);
    else localStorage.removeItem('userGeminiKey');

    if (picaKey) localStorage.setItem('userPicaKey', picaKey);
    else localStorage.removeItem('userPicaKey');

    addToast('API Keys saved securely to your local device.', 'success');
  };

  return (
    <Container className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white border-2 border-white/10">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">
            Profile & Settings
          </h1>
          <p className="text-slate-400">Manage your account, API keys, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Details */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Account Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-1 block">Email Address</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg text-slate-300">
                  <Mail className="w-5 h-5 text-slate-500" />
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 mb-1 block">Subscription Tier</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg text-slate-300 capitalize">
                  {profile?.tier || 'Free'} Tier
                  {profile?.tier === 'free' && (
                    <span className="ml-auto text-xs bg-primary/20 text-purple-300 px-2 py-1 rounded-full border border-primary/30">
                      Upgrade Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Bring Your Own Key */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Bring Your Own Key (BYOK)
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter your own API keys to bypass platform limits. Keys are stored locally on your device and are never sent to our database.
            </p>

            <form onSubmit={saveKeys} className="space-y-5">
              <GlassInput
                label="Google Gemini API Key"
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <GlassInput
                label="OpenRouter API Key (For Express/Craft models)"
                type="password"
                placeholder="sk-or-v1-..."
                value={localStorage.getItem('userOpenRouterKey') || ''}
                onChange={(e) => {
                   if (e.target.value) localStorage.setItem('userOpenRouterKey', e.target.value);
                   else localStorage.removeItem('userOpenRouterKey');
                }}
              />
              <GlassInput
                label="Pica AI API Key (Cover Generation)"
                type="password"
                placeholder="pica_..."
                value={picaKey}
                onChange={(e) => setPicaKey(e.target.value)}
              />
              <div className="pt-2">
                <GlassButton type="submit" className="w-full">
                  Save Keys Securely
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </Container>
  );
}
