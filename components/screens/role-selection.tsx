'use client';

import { useRouter } from 'next/navigation';

export function RoleSelection() {
  const router = useRouter();

  const handleSelectRole = (role: 'parent' | 'child') => {
    if (role === 'parent') {
      router.push('/parent/login');
    } else {
      router.push('/child/join');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-content" style={{ background: 'linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="mb-4">
            <p className="text-yellow-300 text-lg font-semibold">Family Tasks & Rewards</p>
            <p className="text-white/70 text-sm mt-2">Manage chores and rewards together</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleSelectRole('parent')}
            className="w-full bg-yellow-400 text-[#0F4C7D] font-bold py-4 rounded-xl hover:bg-yellow-300 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <span>I&apos;m a Parent</span>
            </div>
          </button>
          
          <button
            onClick={() => handleSelectRole('child')}
            className="w-full bg-white text-[#0F4C7D] font-bold py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">👧</span>
              <span>I&apos;m a Child</span>
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

