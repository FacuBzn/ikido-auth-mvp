"use client";

import { useRequireChildAuth } from "@/hooks/useRequireChildAuth";

export const ChildRewardsClient = () => {
  const child = useRequireChildAuth();

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
