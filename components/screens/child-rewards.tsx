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
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <button onClick={onBack} className="self-start text-xs font-bold uppercase tracking-wide text-[#FFD369] transition-colors hover:text-[#FFC93F]">
        ← Back
      </button>

      <div className="mt-4 flex flex-1 flex-col gap-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#FFD369]">Rewards</h1>
          <p className="text-xs text-gray-200">
            {childName}, you have <span className="font-semibold text-[#FFD369]">{ggPoints} GGPoints</span>.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          {rewards.map((reward) => {
            const canRedeem = ggPoints >= reward.cost;
            return (
              <div key={reward.id} className="flex flex-col items-center justify-between rounded-2xl bg-[#0D3A5C] p-4 text-center">
                <span className="text-3xl">{reward.icon}</span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide">{reward.name}</p>
                  <p className="text-[11px] text-[#FFD369]">{reward.cost} GG</p>
                </div>
                <Button
                  onClick={() => onRewardRedeemed(reward.id, reward.cost)}
                  disabled={!canRedeem}
                  className="w-full rounded-xl bg-[#FFD369] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#0F4C7D] transition hover:bg-[#FFC93F] disabled:cursor-not-allowed disabled:bg-[#b89a47] disabled:text-[#0F4C7D]/70"
                >
                  {canRedeem ? "Redeem" : "Need more"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

