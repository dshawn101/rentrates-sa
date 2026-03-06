import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-primary text-white flex flex-col font-sans">
      <header className="bg-slate-800 shadow p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-accent">OpenBook Builder</Link>
        <nav className="flex gap-4">
          <Link to="/dashboard" className="hover:text-emerald-400">Dashboard</Link>
          <Link to="/transparency" className="hover:text-emerald-400">Transparency</Link>
          {user ? (
            <Link to="/profile" className="text-secondary">{user.email}</Link>
          ) : (
            <Link to="/auth/login" className="bg-secondary px-4 py-2 rounded">Login</Link>
          )}
        </nav>
      </header>
      <main className="flex-1 p-8 container mx-auto">
        {children}
      </main>
      <footer className="bg-slate-900 p-4 text-center text-sm text-gray-400 border-t border-slate-700">
         2025 OpenBook Builder
      </footer>
    </div>
  );
};
