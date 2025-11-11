"use client";

import { Button } from "@/components/ui/button";

type Reward = {
  id: string;
  name: string;
  cost: number;
  icon: string;
};

type ChildRewardsProps = {
  childName: string;
  ggPoints: number;
  rewards: Reward[];
  onBack: () => void;
  onRewardRedeemed: (rewardId: string, cost: number) => void;
};

export function ChildRewards({ childName, ggPoints, rewards, onBack, onRewardRedeemed }: ChildRewardsProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-[#FFD369] mb-2">Rewards</h1>
      <p className="mb-4 text-sm text-gray-200">
        {childName}, you have <span className="font-semibold text-[#FFD369]">{ggPoints} GGPoints</span>.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const canRedeem = ggPoints >= reward.cost;
          return (
            <div key={reward.id} className="flex flex-col items-center rounded-2xl bg-[#0D3A5C] p-4 text-center">
              <span className="text-3xl">{reward.icon}</span>
              <p className="mt-2 text-sm font-semibold">{reward.name}</p>
              <p className="text-xs text-[#FFD369] mb-3">{reward.cost} GG</p>
              <Button
                onClick={() => onRewardRedeemed(reward.id, reward.cost)}
                disabled={!canRedeem}
                className="w-full rounded-xl bg-[#FFD369] px-3 py-2 text-xs font-bold text-[#0F4C7D] transition hover:bg-[#FFC93F] disabled:cursor-not-allowed disabled:bg-[#b89a47] disabled:text-[#0F4C7D]/70"
              >
                {canRedeem ? "Redeem" : "Need more"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

