import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store/bookStore';
import { gemini } from '../../lib/gemini';
import { pica } from '../../lib/pica';
import { exportBook } from '../../lib/export';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function BookWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const book = useBookStore();
  const [covers, setCovers] = useState<string[]>([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const generateOutline = async () => {
    setLoading(true);
    try {
      const outline = await gemini.generateBookOutline(book.title, book.genre, book.tone);
      book.setOutline(outline);
    } catch (e) {
      console.error(e);
      alert("Error generating outline");
    } finally {
      setLoading(false);
    }
  };

  const generateChapter = async (index: number) => {
    const chapter = book.outline[index];
    if (!chapter) return;

    setLoading(true);
    try {
      const content = await gemini.generateChapterContent(chapter, book.tone, Math.floor(book.wordCountTarget / Math.max(book.outline.length, 1)));
      book.updateChapterContent(index, content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateCovers = async () => {
    setLoading(true);
    try {
      const prompt = pica.coverPrompts.bold.replace('[genre]', book.genre).replace('[title]', book.title);
      const urls = await pica.generateCovers(prompt);
      setCovers(urls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded shadow">
        {['Setup', 'Outline', 'Writing', 'Cover', 'Export'].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${step === i + 1 ? 'text-accent font-bold' : 'text-gray-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step === i + 1 ? 'bg-accent text-white' : 'bg-slate-700'}`}>
              {i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-slate-800 p-8 rounded shadow-lg min-h-[500px]">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Step 1: Book Setup</h2>
            <Input placeholder="Title (required)" value={book.title} onChange={e => book.updateMetadata({ title: e.target.value })} />
            <Input placeholder="Subtitle (optional)" value={book.subtitle} onChange={e => book.updateMetadata({ subtitle: e.target.value })} />
            <Input placeholder="Author Name" value={book.author} onChange={e => book.updateMetadata({ author: e.target.value })} />
            <div className="flex gap-4">
              <select className="p-2 bg-slate-700 rounded text-white w-full" value={book.genre} onChange={e => book.updateMetadata({ genre: e.target.value })}>
                <option>Fiction</option>
                <option>Non-fiction</option>
                <option>Business</option>
              </select>
              <select className="p-2 bg-slate-700 rounded text-white w-full" value={book.tone} onChange={e => book.updateMetadata({ tone: e.target.value })}>
                <option>Professional</option>
                <option>Casual</option>
                <option>Academic</option>
              </select>
              <Input type="number" placeholder="Target Word Count" value={book.wordCountTarget} onChange={e => book.updateMetadata({ wordCountTarget: Number(e.target.value) })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 h-full">
            <h2 className="text-2xl font-bold">Step 2: AI Outline Generation</h2>
            <Button onClick={generateOutline} disabled={loading || !book.title} variant="secondary" className="w-64">
              {loading ? 'Generating...' : 'Generate Outline (Gemini 1.5 Pro)'}
            </Button>

            <div className="mt-4 flex flex-col gap-2 overflow-y-auto max-h-96">
              {book.outline.map((ch, i) => (
                <div key={i} className="bg-slate-700 p-4 rounded border-l-4 border-accent">
                  <h3 className="font-bold text-lg">{ch.title}</h3>
                  <p className="text-sm text-gray-300">{ch.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex h-full gap-4">
            <div className="w-1/3 flex flex-col gap-2 border-r border-slate-700 pr-4">
              <h2 className="text-xl font-bold mb-2">Chapters</h2>
              {book.outline.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedChapterIndex(i)}
                  className={`text-left p-2 rounded text-sm ${selectedChapterIndex === i ? 'bg-accent text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {ch.title} {ch.content ? '✅' : ''}
                </button>
              ))}
            </div>
            <div className="w-2/3 flex flex-col gap-4 pl-4">
              {book.outline[selectedChapterIndex] ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">{book.outline[selectedChapterIndex].title}</h3>
                    <Button onClick={() => generateChapter(selectedChapterIndex)} disabled={loading} variant="secondary">
                      {loading ? 'Writing...' : 'AI Expand Chapter'}
                    </Button>
                  </div>
                  <textarea
                    className="w-full h-96 p-4 bg-slate-900 rounded text-white font-mono text-sm leading-relaxed"
                    value={book.outline[selectedChapterIndex].content || ''}
                    onChange={(e) => book.updateChapterContent(selectedChapterIndex, e.target.value)}
                    placeholder="Start typing or click AI Expand..."
                  />
                </>
              ) : (
                <p className="text-gray-400 mt-10 text-center">Generate an outline in Step 2 first.</p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Step 4: Cover Design</h2>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">Generate variations based on your genre: {book.genre}</p>
              <Button onClick={generateCovers} disabled={loading} variant="secondary">
                {loading ? 'Generating...' : 'Generate 4 Covers (Pica AI)'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {covers.map((url, i) => (
                <div
                  key={i}
                  onClick={() => book.setCover(url)}
                  className={`cursor-pointer rounded border-4 overflow-hidden transition-all ${book.coverUrl === url ? 'border-accent scale-105' : 'border-transparent'}`}
                >
                  <img src={url} alt={`Cover option ${i+1}`} className="w-full h-auto object-cover aspect-[2/3]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex gap-8">
            <div className="w-1/2 flex flex-col gap-6">
              <h2 className="text-2xl font-bold">Step 5: Review & Export</h2>
              <div className="bg-slate-900 p-6 rounded shadow" id="book-preview-container">
                {book.coverUrl && <img src={book.coverUrl} className="w-48 h-auto mx-auto mb-6 shadow-xl rounded" alt="Cover" />}
                <h1 className="text-3xl font-bold text-center mb-2">{book.title || 'Untitled'}</h1>
                <p className="text-center text-gray-400 mb-8">By {book.author || 'Anonymous'}</p>
                <hr className="border-slate-700 mb-8" />
                <h3 className="font-bold text-xl mb-4 text-center">Table of Contents</h3>
                <ul className="list-decimal pl-8 mb-8 text-gray-300">
                  {book.outline.map((ch, i) => <li key={i} className="mb-2">{ch.title}</li>)}
                </ul>
              </div>
            </div>
            <div className="w-1/2 flex flex-col gap-4">
               <h3 className="font-bold text-xl">Export Options</h3>
               <p className="text-gray-400 text-sm">Review your generated book. Download standard print-ready or digital formats.</p>

               <div className="grid grid-cols-1 gap-4 mt-4">
                 <Button onClick={() => exportBook.toPDF('book-preview-container', book.title)} variant="accent" className="h-16 text-lg w-full">
                    Export to PDF (Print-Ready)
                 </Button>
                 <Button onClick={() => exportBook.toEPUB(book)} variant="secondary" className="h-16 text-lg w-full">
                    Export to EPUB (Kindle/Apple Books)
                 </Button>
               </div>

               <div className="mt-8 bg-slate-900 p-4 rounded text-sm text-gray-400 border border-slate-700">
                 <p className="font-bold text-white mb-2">Estimated Costs for this Book:</p>
                 <ul className="list-disc pl-5">
                   <li>Gemini Outline Generation: ~R 0.10</li>
                   <li>Gemini Content Generation ({book.outline.length} chapters): ~R {((book.wordCountTarget/1000) * 0.15).toFixed(2)}</li>
                   <li>Pica Cover Generation (4 variations): ~R 1.50</li>
                 </ul>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <Button onClick={handlePrev} disabled={step === 1} variant="ghost" className="bg-slate-700 px-8">Back</Button>
        {step < 5 ? (
          <Button onClick={handleNext} variant="accent" className="px-8">Next Step</Button>
        ) : (
          <Button onClick={() => navigate('/dashboard')} variant="primary" className="px-8 border border-accent">Finish & Return to Dashboard</Button>
        )}
      </div>
    </div>
  );
}
