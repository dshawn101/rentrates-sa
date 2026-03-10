import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { FileText, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface BookCardProps {
  id: string;
  title: string;
  status: 'draft' | 'outline' | 'writing' | 'formatting' | 'published';
  updatedAt: string;
  wordCount?: number;
  coverUrl?: string;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function BookCard({ id, title, status, updatedAt, wordCount = 0, coverUrl, onDelete, onDuplicate }: BookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColors = {
    draft: 'default',
    outline: 'warning',
    writing: 'success',
    formatting: 'warning',
    published: 'outline'
  } as const;

  return (
    <GlassCard className="group relative overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
      <Link to={`/book/${id}`} className="absolute inset-0 z-0" />

      <div className="p-5 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-4">
          {coverUrl ? (
            <div className="w-16 h-24 bg-black/40 rounded shadow-md overflow-hidden flex-shrink-0">
               <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-16 bg-gradient-to-br from-purple-500/20 to-primary/10 rounded flex items-center justify-center border border-white/10 flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-300/50" />
            </div>
          )}

          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#1a1625] border border-white/10 rounded-xl shadow-xl py-1 z-50">
                <Link to={`/book/${id}/edit`} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Details
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate?.(id); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Duplicate
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete?.(id); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col pointer-events-none">
          <h3 className="font-bold text-lg text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-auto pt-4">
             <Badge variant={statusColors[status]} className="capitalize">
                {status}
             </Badge>
             <span className="text-xs text-slate-400 font-medium">
                {wordCount.toLocaleString()} words
             </span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Updated {new Date(updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}