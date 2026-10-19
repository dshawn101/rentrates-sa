import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { Link } from 'react-router-dom';
export function Transparency() {
  return <Container className="py-12 space-y-6 text-slate-300">
    <Link to="/dashboard" className="text-primary">Back to dashboard</Link>
    <h1 className="text-3xl font-bold text-white">Feature & Cost Transparency</h1>
    <GlassCard className="p-8 space-y-4">
      <p>Plan chapters, write and save your manuscript, then download a PDF. Free-tier PDFs include a watermark.</p>
      <p>Gemini assistance is optional and requires a working provider key and model. Requests go directly from your browser to Google; your provider sets the price.</p>
      <p>The app does not currently track tokens, estimate costs or process subscription payments. Check the provider dashboard for actual usage and charges.</p>
      <p>Custom cover generation, OpenRouter, EPUB and DOCX are not available in this version.</p>
    </GlassCard>
  </Container>;
}
