import { useState } from 'react';
import type { Book } from '../../../store/useBookStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassInput } from '../../../components/ui/GlassInput';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import { Download, CheckCircle2, FileText, ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface ExportFormatterProps {
  book: Book;
  onPrev: () => void;
}

export function ExportFormatter({ book, onPrev }: ExportFormatterProps) {
  const { addToast } = useToastStore();
  const { profile } = useAuth();
  const [isbn, setIsbn] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'epub' | 'docx'>('pdf');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Compiling chapters...');

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      setExportStatus('Applying formatting...');

      await new Promise(resolve => setTimeout(resolve, 1500));
      setExportStatus(`Generating ${exportFormat.toUpperCase()} file...`);

      // Call actual export logic here
      const chapters = await supabase.from('chapters').select('*').eq('book_id', book.id).order('order_index', {ascending: true});
      const exportData = {
         title: book.title,
         author: book.metadata?.author || 'Unknown',
         chapters: chapters.data?.map(c => ({ title: c.title, content: c.content })) || [],
         isbn: isbn
      };

      if (exportFormat === 'pdf') {
         const { exportToPDF } = await import('../../../lib/export');
         await exportToPDF(exportData, profile?.tier || 'free');
      } else if (exportFormat === 'epub') {
         const { exportToEPUB } = await import('../../../lib/export');
         await exportToEPUB(exportData);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Mark as published in DB (if it wasn't already)
      await supabase.from('books').update({ status: 'published' }).eq('id', book.id);

      addToast(`${exportFormat.toUpperCase()} generated successfully!`, 'success');
      setExportStatus(null);
    } catch (error) {
      addToast('Failed to export book', 'error');
      setExportStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24 px-4 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <div className="text-center mb-8 border-b border-white/10 pb-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Book is Ready!</h2>
            <p className="text-slate-400 text-lg">
              Review final metadata and export your manuscript for publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Metadata Confirmation */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Publishing Details</h3>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-slate-500 block">Title</span>
                  <span className="font-medium text-white text-lg">{book.title}</span>
                  {book.metadata?.subtitle && (
                    <span className="text-slate-400 block">{book.metadata.subtitle}</span>
                  )}
                </div>

                <div>
                  <span className="text-sm text-slate-500 block">Author</span>
                  <span className="font-medium text-white">{book.metadata?.author || 'Unknown Author'}</span>
                </div>

                <div>
                  <span className="text-sm text-slate-500 block">Genre</span>
                  <span className="font-medium text-white capitalize">{book.metadata?.genre || 'Uncategorized'}</span>
                </div>

                <GlassInput
                  label="ISBN (Optional)"
                  placeholder="e.g. 978-3-16-148410-0"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                />
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Format & Export</h3>

              <div className="grid gap-3">
                {[
                  { id: 'pdf', title: 'PDF (Print Ready)', desc: 'Formatted for KDP paperback (A5)', icon: FileText, tierRequired: 'free' },
                  { id: 'epub', title: 'EPUB (eBook)', desc: 'Standard format for Kindle & Apple Books', icon: FileText, tierRequired: 'express' },
                  { id: 'docx', title: 'DOCX (Word)', desc: 'For professional editing & formatting', icon: FileText, tierRequired: 'craft' },
                ].map((format) => {

                   const currentTier = profile?.tier || 'free';
                   const tierHierarchy = { free: 0, express: 1, craft: 2 };
                   const isLocked = tierHierarchy[format.tierRequired as keyof typeof tierHierarchy] > tierHierarchy[currentTier as keyof typeof tierHierarchy];

                   return (
                      <button
                        key={format.id}
                        disabled={isLocked}
                        onClick={() => setExportFormat(format.id as any)}
                        className={`
                          w-full text-left p-4 rounded-xl border flex items-start gap-4 transition-all duration-200 relative overflow-hidden
                          ${exportFormat === format.id
                            ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-primary'
                            : isLocked
                               ? 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
                               : 'bg-black/20 border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300'
                          }
                        `}
                      >
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative z-10
                          ${exportFormat === format.id ? 'bg-primary text-white' : 'bg-white/5 text-slate-500'}
                        `}>
                          {isLocked ? <Lock className="w-4 h-4" /> : <format.icon className="w-5 h-5" />}
                        </div>
                        <div className="relative z-10">
                          <p className={`font-semibold flex items-center gap-2 ${exportFormat === format.id ? 'text-white' : 'text-slate-200'}`}>
                            {format.title}
                            {isLocked && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">{format.tierRequired} tier required</span>}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{format.desc}</p>
                        </div>
                        {isLocked && <div className="absolute inset-0 bg-striped pointer-events-none opacity-20 mix-blend-overlay"></div>}
                      </button>
                   );
                })}
              </div>

              <GlassButton
                onClick={handleExport}
                isLoading={isExporting}
                className="w-full py-4 text-lg mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-[0_4px_15px_rgba(16,185,129,0.3)] border-none"
              >
                {exportStatus || `Download ${exportFormat.toUpperCase()}`}
                {!isExporting && <Download className="w-5 h-5 ml-2" />}
              </GlassButton>

              <a href="https://kdp.amazon.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-purple-400 flex items-center justify-center mt-4 transition-colors">
                Publishing to KDP? Read our guide <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <GlassButton variant="secondary" onClick={onPrev}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cover Design
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}