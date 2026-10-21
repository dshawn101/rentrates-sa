import type { BookFolder } from './BookFolders';
import { getCoverUrl } from '../../lib/covers';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { FileText, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface BookCardProps {
  draggable?:boolean;
  onDragStart?:(event:React.DragEvent<HTMLDivElement>)=>void;
  folders?:BookFolder[];
  folderId?:string|null;
  moving?:boolean;
  onMove?:(id:string,folder:string|null)=>Promise<void>;
  id: string;
  title: string;
  status: 'draft' | 'outline' | 'writing' | 'formatting' | 'published';
  updatedAt: string;
  wordCount?: number;
  coverUrl?: string;
  coverPath?: string;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function BookCard({ id, title, status, updatedAt, wordCount = 0, coverUrl, coverPath, onDelete, onDuplicate,draggable,onDragStart,folders,folderId,onMove,moving }: BookCardProps) {
  const [signedCover, setSignedCover] = useState('');
  useEffect(() => { let active = true; if (coverPath) getCoverUrl(coverPath).then(url => { if (active) setSignedCover(url); }).catch(() => {}); return () => { active = false; }; }, [coverPath]);
  const image = coverPath ? signedCover : coverUrl;
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColors = {
    draft: 'default',
    outline: 'warning',
    writing: 'success',
    formatting: 'warning',
    published: 'outline'
  } as const;

  return (
    <GlassCard draggable={draggable} onDragStart={onDragStart} className="group relative overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
      <Link draggable={false} to={`/book/${id}`} aria-label={`Open ${title}`} className="absolute inset-0 z-0" />

      <div className="p-5 flex flex-col h-full relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-4">
          {image ? (
            <div className="w-16 h-24 bg-black/40 rounded shadow-md overflow-hidden flex-shrink-0">
               <img src={image} onError={() => setSignedCover('')} alt={title} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-16 bg-gradient-to-br from-purple-500/20 to-primary/10 rounded flex items-center justify-center border border-white/10 flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-300/50" />
            </div>
          )}

          <div className="relative pointer-events-auto z-20">
            <button
              aria-label={`Actions for ${title}`}
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#1a1625] border border-white/10 rounded-xl shadow-xl py-1 z-50">
                <Link to={`/book/${id}?step=1`} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
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
      {onMove&&<div className="relative z-20 px-5 pb-5"><label className="text-xs text-slate-400 block">Move to folder<select aria-label={`Move ${title} to folder`} disabled={moving} value={folderId||''} onChange={e=>void onMove(id,e.target.value||null)} className="block w-full mt-2 bg-slate-900 text-slate-200 rounded-lg p-2 border border-white/10"><option value="">Unfiled</option>{folders?.map(folder=><option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label></div>}
    </GlassCard>
  );
}