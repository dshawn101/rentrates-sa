import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Settings, CreditCard, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Books', href: '/books', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Billing & Usage', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

import { ShieldCheck } from 'lucide-react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md"
        onClick={() => setIsOpen(!isOpen)}
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
          "fixed md:relative w-64 h-screen bg-[#0f0c1b]/80 border-r border-white/10 backdrop-blur-2xl z-40 transition-transform duration-300 ease-in-out transform flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">
              Puble
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
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

        <div className="p-4 border-t border-white/5">
          <Link to="/transparency" className="flex items-center gap-2 mb-4 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            <ShieldCheck className="w-4 h-4" />
            0% Markup Transparency
          </Link>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Free Tier
            </h4>
            <div className="w-full bg-black/40 rounded-full h-1.5 mb-2">
              <div className="bg-gradient-to-r from-primary to-purple-400 h-1.5 rounded-full w-[45%]" />
            </div>
            <p className="text-xs text-slate-400">45k / 100k words</p>
          </div>
        </div>
      </aside>
    </>
  );
}