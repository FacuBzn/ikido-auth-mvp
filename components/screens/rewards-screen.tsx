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
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="mb-2 text-3xl font-bold">Rewards</h1>
      <p className="mb-6 text-sm text-gray-200">Pick a surprise to keep the mission fun going!</p>

      <div className="grid grid-cols-2 gap-4">
        {FEATURED_REWARDS.map((reward) => (
          <button
            key={reward.name}
            onClick={() => onRewardRedeemed(reward.points)}
            className="flex flex-col items-center rounded-2xl border-2 border-[#FFD369] bg-[#0D3A5C] p-4 text-sm font-semibold transition hover:bg-[#0A2A47]"
          >
            <span className="text-4xl">{reward.icon}</span>
            <span className="mt-2">{reward.name}</span>
            <span className="text-xs text-[#FFD369]">{reward.points} GG</span>
          </button>
        ))}
      </div>
    </div>
  );
}

