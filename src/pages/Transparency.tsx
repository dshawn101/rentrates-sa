import React from 'react';

export default function Transparency() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-accent">Transparency & Pricing</h1>
      <p className="text-xl text-gray-300">
        We believe in a <strong>zero markup policy</strong>. You only pay for what the underlying AI APIs cost.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="bg-slate-800 p-6 rounded shadow border-l-4 border-secondary">
          <h2 className="text-2xl font-bold mb-4">Google Gemini 3.1 Pro</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-2">
            <li><strong>Input:</strong> $3.50 / 1M tokens</li>
            <li><strong>Output:</strong> $10.50 / 1M tokens</li>
            <li>Used for: Book outlines, chapter writing, rewriting.</li>
          </ul>
          <p className="mt-4 text-sm text-emerald-400">Average Chapter Cost: ~R 0.50</p>
        </div>

        <div className="bg-slate-800 p-6 rounded shadow border-l-4 border-accent">
          <h2 className="text-2xl font-bold mb-4">Pica AI (Covers)</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-2">
            <li><strong>Images:</strong> $0.02 / generation</li>
            <li>Used for: Generating 4 variations of book covers based on prompts.</li>
          </ul>
          <p className="mt-4 text-sm text-emerald-400">Average Cover Batch Cost: ~R 1.50</p>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded shadow mt-8 text-center">
        <h2 className="text-xl font-bold mb-2">Bring Your Own Key (BYOK)</h2>
        <p className="text-gray-400">
          Want even more control? Enter your own API keys in your profile settings and bypass our billing entirely.
        </p>
      </div>
    </div>
  );
}
