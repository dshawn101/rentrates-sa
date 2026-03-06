import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/book/new" className="bg-accent text-white px-4 py-2 rounded hover:bg-emerald-600 font-semibold">
          + New Book
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded shadow">
          <h3 className="text-gray-400 mb-2">Books Created</h3>
          <p className="text-4xl font-bold text-accent">0</p>
        </div>
        <div className="bg-slate-800 p-6 rounded shadow">
          <h3 className="text-gray-400 mb-2">Words Written</h3>
          <p className="text-4xl font-bold text-secondary">0</p>
        </div>
        <div className="bg-slate-800 p-6 rounded shadow">
          <h3 className="text-gray-400 mb-2">API Costs (ZAR)</h3>
          <p className="text-4xl font-bold text-red-400">R 0.00</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Books</h2>
        <div className="bg-slate-800 p-8 rounded flex justify-center items-center border-dashed border-2 border-slate-600">
          <p className="text-gray-400">No books yet. Start writing!</p>
        </div>
      </div>
    </div>
  );
}
