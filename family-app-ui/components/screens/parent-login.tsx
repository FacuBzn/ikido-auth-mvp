'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

interface ParentLoginProps {
  onLoginSuccess: (parentId: string, name: string, email: string) => void;
  onBackClick: () => void;
}

export function ParentLogin({ onLoginSuccess, onBackClick }: ParentLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string) => {
    return pwd.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email');
      }

      if (isSignUp && !name.trim()) {
        throw new Error('Please enter your name');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters');
      }

      const supabase = createClient();

      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          onLoginSuccess(authData.user.id, name, email);
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        if (authData.user) {
          onLoginSuccess(authData.user.id, name || email, email);
        }
      }
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
          <p className="text-yellow-300 font-semibold">{isSignUp ? 'Create Parent Account' : 'Parent Login'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-white text-sm font-semibold mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-yellow-400 text-white placeholder-white/50 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400/30 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {isSignUp && (
              <p className="text-white/60 text-xs mt-2">Minimum 6 characters</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? '⏳ Loading...' : isSignUp ? '✨ Create Account' : '🚀 Login'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-white/70 text-sm mb-3">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setName('');
              setEmail('');
              setPassword('');
            }}
            className="text-yellow-300 font-semibold hover:text-yellow-200 transition-colors underline"
          >
            {isSignUp ? 'Sign In instead' : 'Create one now'}
          </button>
        </div>
      </div>
    </div>
  );
}
