'use client';

import { useState } from 'react';

interface ChildLoginProps {
  onLoginSuccess: (childId: string, childName: string, parentId: string) => void;
  onBackClick: () => void;
}

export function ChildLogin({ onLoginSuccess, onBackClick }: ChildLoginProps) {
  const [code, setCode] = useState('');
  const [childName, setChildName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (code.length !== 6) {
        throw new Error('Code must be exactly 6 characters');
      }

      if (!childName.trim()) {
        throw new Error('Please enter your name');
      }

      if (childName.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      const childId = `child_${Date.now()}`;
      const parentId = `parent_${code.toUpperCase()}`;

      onLoginSuccess(childId, childName, parentId);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)' }}>
      <div className="w-full max-w-md">
        <button
          onClick={onBackClick}
          className="text-white mb-6 hover:text-yellow-300 transition-colors flex items-center gap-1 font-semibold"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">iKidO</h1>
          <div className="h-0.5 w-12 bg-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-300 font-semibold">Welcome, Player!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white text-sm font-semibold mb-2">Your Name</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
              required
            />
            <p className="text-white/60 text-xs mt-2">This is how parents will see you</p>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">Parent's Code</label>
            <div className="bg-white/5 p-4 rounded-lg border-2 border-yellow-400/30 mb-3">
              <input
                type="text"
                value={code.toUpperCase()}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full bg-transparent text-white placeholder-white/50 focus:outline-none text-center tracking-widest text-3xl font-bold"
                required
              />
            </div>
            <p className="text-white/60 text-xs">Ask your parent for this 6-character code</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !childName.trim()}
            className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? '⏳ Entering...' : '🎮 Enter Game'}
          </button>
        </form>

        <div className="bg-blue-900/40 border-2 border-yellow-400/40 rounded-lg p-4 mt-6 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-white font-semibold text-sm">Need a code?</p>
              <p className="text-white/70 text-xs mt-1">Ask your parent to go to their dashboard and generate one for you!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
