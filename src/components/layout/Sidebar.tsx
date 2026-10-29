import {FeedbackButton} from '../help/FeedbackButton';
import { Brand } from '../ui/Brand';
import { useAuth } from '../../hooks/useAuth';
import { useBookStore } from '../../store/useBookStore';
import { totalBookWords } from '../../lib/book-stats';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, KeyRound, Settings, Menu, LifeBuoy, ShieldCheck, Compass, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Books', href: '/books', icon: BookOpen },
  { name: 'Writing Goals', href: '/writing-goals', icon: Target },
  { name: 'AI Providers', href: '/ai-providers', icon: KeyRound },
  { name: 'Features & Costs', href: '/transparency', icon: ShieldCheck },
  { name: 'Author Guide', href: '/author-guide', icon: Compass },
  { name: 'Help Center', href: '/help', icon: LifeBuoy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const { books, error, isLoading } = useBookStore();

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md"
        aria-label="Toggle dashboard navigation" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative w-80 max-w-[calc(100vw-1rem)] shrink-0 h-screen bg-[#0f0c1b]/80 border-r border-white/10 backdrop-blur-2xl z-40 transition-transform duration-300 ease-in-out transform flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Brand />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group",
                  isActive
                    ? "bg-primary/20 text-purple-200 border border-primary/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5"><FeedbackButton className="mb-4 w-full"/>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {profile?.tier || 'free'} Tier
            </h4>
            <p className="text-xs text-slate-400">{isLoading ? 'Loading saved words…' : error ? 'Word count unavailable' : `${totalBookWords(books).toLocaleString()} saved words`}</p>
          </div>
        </div>
      </aside>
    </>
  );
}