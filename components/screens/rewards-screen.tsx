"use client";

type RewardsScreenProps = {
  onBack: () => void;
  onRewardRedeemed: (points: number) => void;
};

const FEATURED_REWARDS = [
  { name: "Movie", points: 300, icon: "🎬" },
  { name: "Game", points: 250, icon: "🎮" },
  { name: "Toy", points: 190, icon: "🧸" },
  { name: "Gift", points: 400, icon: "🎁" },
];

export function RewardsScreen({ onBack, onRewardRedeemed }: RewardsScreenProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-linear-to-b from-[#0F4C7D] to-[#1A5FA0] px-5 py-6 text-white shadow-2xl">
      <button onClick={onBack} className="self-start text-xs font-bold uppercase tracking-wide text-[#FFD369] transition-colors hover:text-[#FFC93F]">
        ← Back
      </button>

      <div className="mt-4 flex flex-1 flex-col gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-xs text-gray-200">Pick a surprise to keep the mission fun going!</p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          {FEATURED_REWARDS.map((reward) => (
            <button
              key={reward.name}
              onClick={() => onRewardRedeemed(reward.points)}
              className="flex flex-col items-center justify-between rounded-2xl border border-[#FFD369] bg-[#0D3A5C] p-4 text-xs font-semibold transition hover:bg-[#0A2A47]"
            >
              <span className="text-3xl">{reward.icon}</span>
              <span>{reward.name}</span>
              <span className="text-[11px] text-[#FFD369]">{reward.points} GG</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

