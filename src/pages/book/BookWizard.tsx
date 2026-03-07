import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store/useBookStore';
import { GlassButton } from '../../components/ui/GlassButton';
import { Settings, List, PenTool, Image as ImageIcon, Download, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Step components
import { BookSetup } from './steps/BookSetup';
import { OutlineGenerator } from './steps/OutlineGenerator';
import { ChapterEditor } from './steps/ChapterEditor';
import { CoverDesigner } from './steps/CoverDesigner';
import { ExportFormatter } from './steps/ExportFormatter';

const STEPS = [
  { id: 1, title: 'Setup', icon: Settings },
  { id: 2, title: 'Outline', icon: List },
  { id: 3, title: 'Write', icon: PenTool },
  { id: 4, title: 'Cover', icon: ImageIcon },
  { id: 5, title: 'Export', icon: Download },
];

export function BookWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { books, fetchBooks } = useBookStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Find current book
  const book = books.find(b => b.id === id);

  useEffect(() => {
    const loadBook = async () => {
      setIsLoading(true);
      if (books.length === 0) {
        await fetchBooks();
      }
      setIsLoading(false);
    };
    loadBook();
  }, [id, fetchBooks, books.length]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20 text-white">
        <h2 className="text-2xl font-bold mb-4">Book not found</h2>
        <GlassButton onClick={() => navigate('/dashboard')}>Return to Dashboard</GlassButton>
      </div>
    );
  }

  const handleNextStep = async () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);

      // Update book status progressively
      const statusMap = {
        1: 'outline',
        2: 'writing',
        3: 'formatting',
        4: 'formatting',
        5: 'published'
      } as const;

      try {
        await supabase
          .from('books')
          .update({ status: statusMap[currentStep as keyof typeof statusMap] })
          .eq('id', book.id);
        fetchBooks(); // Refresh state silently
      } catch (err) {
        console.error("Failed to update status", err);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-500">

      {/* Wizard Header / Progress Bar */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4 line-clamp-1">{book.title}</h1>

        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted ? 'bg-primary border-primary text-white' :
                      isCurrent ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' :
                      'bg-slate-900 border-white/10 text-slate-500'}
                  `}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${isCurrent ? 'text-primary' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}

          {/* Progress Line connecting dots */}
          <div className="absolute top-[8.5rem] sm:top-[7.5rem] left-[10%] right-[10%] h-0.5 bg-white/10 -z-0">
             <div
               className="h-full bg-primary transition-all duration-500"
               style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
             />
          </div>
        </div>
      </div>

      {/* Step Content Area */}
      <div className="flex-1 min-h-0 relative">
        {currentStep === 1 && <BookSetup book={book} onNext={handleNextStep} />}
        {currentStep === 2 && <OutlineGenerator book={book} onNext={handleNextStep} onPrev={handlePrevStep} />}
        {currentStep === 3 && <ChapterEditor book={book} onNext={handleNextStep} onPrev={handlePrevStep} />}
        {currentStep === 4 && <CoverDesigner book={book} onNext={handleNextStep} onPrev={handlePrevStep} />}
        {currentStep === 5 && <ExportFormatter book={book} onPrev={handlePrevStep} />}
      </div>

    </div>
  );
}
