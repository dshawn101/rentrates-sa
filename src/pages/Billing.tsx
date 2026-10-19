import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { useToastStore } from '../store/useToastStore';
import { Check, Star, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    interval: 'forever',
    description: 'Perfect for trying out the platform and writing your first short book.',
    features: [
      'Basic AI Outlining (Gemini Flash)',
      'Write up to 10,000 words',
      '1 Standard Cover Generation',
      'Export to PDF (Watermarked)',
      'Community Support'
    ],
    buttonText: 'Current Plan',
    popular: false
  },
  {
    id: 'express',
    name: 'Express',
    price: '$9',
    interval: '/ month',
    description: 'For authors who want to publish professional books quickly.',
    features: [
      'Advanced AI (Gemini Pro / OpenRouter)',
      'Write up to 100,000 words/mo',
      '10 HD Cover Generations',
      'Export to PDF & EPUB (No Watermarks)',
      'Priority Email Support'
    ],
    buttonText: 'Upgrade to Express',
    popular: true
  },
  {
    id: 'craft',
    name: 'Craft',
    price: '$29',
    interval: '/ month',
    description: 'Unlimited access to all AI models for serious publishing businesses.',
    features: [
      'All Premium AI Models (Claude, GPT-4o)',
      'Unlimited Words',
      'Unlimited Cover Generations',
      'All Export Formats + DOCX',
      'API Access & BYOK Support'
    ],
    buttonText: 'Upgrade to Craft',
    popular: false
  }
];

export function Billing() {
  const { profile } = useAuth();
  const { addToast } = useToastStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleUpgrade = async (tierId: string) => {
    if (tierId === profile?.tier) return;

    setIsProcessing(tierId);
    try {
      // In a real app, this would redirect to a Stripe Checkout Session
      // const response = await fetch('/api/create-checkout-session', { method: 'POST', body: JSON.stringify({ tier: tierId }) });
      // const { url } = await response.json();
      // window.location.href = url;

      // For MVP, simulate a successful upgrade
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
         // Security note: RLS prevents this direct update in the real schema,
         // so in production this would be handled by a Stripe webhook hitting a secure endpoint.
         // For the sake of the MVP UI demo, we'll pretend it succeeds and show a toast.
         addToast(`Successfully upgraded to ${tierId.toUpperCase()} tier! (Simulated)`, 'success');
      }

    } catch (error: any) {
      addToast(error.message || 'Failed to process upgrade', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <Container className="space-y-8 animate-in fade-in duration-500 py-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-primary">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Choose the plan that fits your writing goals. Upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {TIERS.map((tier) => {
          const isCurrentPlan = profile?.tier === tier.id || (!profile?.tier && tier.id === 'free');

          return (
            <GlassCard
              key={tier.id}
              className={`relative flex flex-col p-8 transition-all duration-300 ${
                tier.popular
                  ? 'ring-2 ring-primary shadow-[0_0_30px_rgba(139,92,246,0.2)] scale-105 md:-mt-4 md:mb-4 z-10'
                  : 'hover:border-white/30'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-slate-400 font-medium">{tier.interval}</span>
                </div>
                <p className="text-sm text-slate-400 min-h-[40px]">{tier.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/20 p-0.5 shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <GlassButton
                variant={tier.popular ? 'primary' : 'secondary'}
                className="w-full py-3"
                disabled={isCurrentPlan || isProcessing !== null}
                isLoading={isProcessing === tier.id}
                onClick={() => handleUpgrade(tier.id)}
              >
                {isCurrentPlan ? 'Current Plan' : tier.buttonText}
              </GlassButton>
            </GlassCard>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto mt-16 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-white mb-1">Secure Payments</h4>
          <p className="text-sm text-slate-400">
            All transactions are securely processed by Stripe. We do not store your credit card information. Cancel or change your plan at any time.
          </p>
        </div>
      </div>
    </Container>
  );
}
