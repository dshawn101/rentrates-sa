import { useAuth } from '../../hooks/useAuth';
import { GlassButton } from '../ui/GlassButton';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f0c1b]/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex-1 flex items-center md:hidden">
        {/* Placeholder to balance mobile layout with sidebar toggle */}
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 flex justify-center md:justify-start">
        {/* Breadcrumbs or Page Title could go here */}
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">
                {user.email}
              </span>
              <span className="text-xs text-primary capitalize">
                {profile?.tier || 'Free'} Tier
              </span>
            </div>
            <div className="relative group">
              <button className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium border-2 border-white/10 hover:border-primary/50 transition-colors">
                <User className="w-4 h-4" />
              </button>

              <div className="absolute right-0 mt-2 w-48 py-2 bg-[#1a1625] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform origin-top-right">
                <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                  Profile Settings
                </Link>
                <Link to="/billing" className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                  Billing
                </Link>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/auth/login">
              <GlassButton variant="ghost" className="text-sm">Log in</GlassButton>
            </Link>
            <Link to="/auth/signup">
              <GlassButton className="text-sm">Get Started</GlassButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}