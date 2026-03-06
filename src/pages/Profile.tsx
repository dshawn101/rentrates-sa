import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Profile() {
  const { user } = useAuth();
  const [geminiKey, setGeminiKey] = useState('');
  const [picaKey, setPicaKey] = useState('');

  const saveKeys = () => {
    // In a real app, these would be encrypted and saved to the user's Supabase profile
    // For MVP, we save to local storage
    localStorage.setItem('userGeminiKey', geminiKey);
    localStorage.setItem('userPicaKey', picaKey);
    alert('Keys saved locally!');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold">User Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300"><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="mt-4 border border-slate-600">
            Log Out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="text-accent">Bring Your Own Key (BYOK)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            Enter your own API keys to bypass our zero-markup billing. Your keys are stored locally in your browser for this MVP.
          </p>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Google Gemini API Key</label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Pica AI Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={picaKey}
              onChange={e => setPicaKey(e.target.value)}
            />
          </div>

          <Button variant="accent" onClick={saveKeys} className="w-32 mt-2">
            Save Keys
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics (Monthly ZAR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 w-full max-w-md">
            <div className="flex justify-between text-sm">
              <span>Current Usage</span>
              <span className="text-red-400 font-bold">R 14.50</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>R 0</span>
              <span>Budget: R 100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
