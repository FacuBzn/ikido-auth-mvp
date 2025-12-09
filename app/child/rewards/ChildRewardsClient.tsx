"use client";

import { useRequireChildAuth } from "@/hooks/useRequireChildAuth";
import { useSessionStore } from "@/store/useSessionStore";
import { Loader2 } from "lucide-react";

export const ChildRewardsClient = () => {
  const child = useSessionStore((state) => state.child);
  const hydrated = useSessionStore((state) => state._hasHydrated);

  // Show loader while Zustand hydrates
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, check auth
  useRequireChildAuth();

  if (!child) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold text-white mb-2">Rewards</h2>
          <p className="text-yellow-300 font-semibold">Coming Soon</p>
          <p className="text-white/70 text-sm mt-2">
            Rewards feature will be available in a future update
          </p>
        </div>
      </div>
    </div>
  );
};
