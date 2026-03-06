import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center h-full">
      <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded shadow-md w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="p-2 rounded bg-slate-700 text-white" required
        />
        <input
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="p-2 rounded bg-slate-700 text-white" required
        />
        <button type="submit" className="bg-accent p-2 rounded text-white font-bold hover:bg-emerald-600">
          Sign In
        </button>
        <p className="text-sm text-center">Don't have an account? <Link to="/auth/signup" className="text-secondary hover:underline">Sign up</Link></p>
      </form>
    </div>
  );
}
