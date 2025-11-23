'use client';

import { useState } from 'react';

interface RoleSelectionProps {
  onSelectRole: (role: 'parent' | 'child') => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="mb-4">
            <div className="text-6xl font-bold text-white mb-2">iKidO</div>
            <div className="h-1 w-16 bg-yellow-400 mx-auto rounded-full"></div>
          </div>
          <p className="text-yellow-300 text-lg font-semibold">Family Tasks & Rewards</p>
          <p className="text-white/70 text-sm mt-2">Manage chores and rewards together</p>
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => onSelectRole('parent')}
            className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-4 rounded-xl hover:bg-yellow-300 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <span>I'm a Parent</span>
            </div>
          </button>
          
          <button
            onClick={() => onSelectRole('child')}
            className="w-full bg-white text-[#0F4C7D] font-bold py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">👧</span>
              <span>I'm a Child</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-white/90 text-xs font-semibold">Parents</p>
            <p className="text-white/60 text-xs mt-1">Manage tasks & rewards</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-white/90 text-xs font-semibold">Children</p>
            <p className="text-white/60 text-xs mt-1">Complete tasks & earn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
