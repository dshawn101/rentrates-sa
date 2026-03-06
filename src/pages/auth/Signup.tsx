import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center h-full">
      <form onSubmit={handleSignup} className="bg-slate-800 p-8 rounded shadow-md w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="p-2 rounded bg-slate-700 text-white" required
        />
        <input
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="p-2 rounded bg-slate-700 text-white" required
        />
        <button type="submit" className="bg-secondary p-2 rounded text-white font-bold hover:bg-blue-700">
          Sign Up
        </button>
        <p className="text-sm text-center">Already have an account? <Link to="/auth/login" className="text-accent hover:underline">Log in</Link></p>
      </form>
    </div>
  );
}
