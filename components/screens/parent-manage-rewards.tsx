"use client";

import { useState } from "react";

type ParentManageRewardsProps = {
  onBack: () => void;
  rewards: Array<{ id: string; name: string; cost: number; icon: string }>;
  onAddReward: (reward: { name: string; cost: number; icon: string }) => void;
};

const EMOJIS = ["🎬", "🎮", "🧸", "🎁", "🍦", "🎡", "🎧", "📘"];

export function ParentManageRewards({ onBack, rewards, onAddReward }: ParentManageRewardsProps) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(100);
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [error, setError] = useState("");

  const handleAddReward = () => {
    if (!name.trim()) {
      setError("Reward name is required");
      return;
    }

    onAddReward({ name: name.trim(), cost, icon });
    setName("");
    setCost(100);
    setIcon(EMOJIS[0]);
    setError("");
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-6 text-white shadow-2xl">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-[#FFD369] transition-colors hover:text-[#FFC93F]"
      >
        ← Back
      </button>
      <h1 className="mb-2 text-3xl font-bold">Manage Rewards</h1>
      <p className="mb-6 text-sm text-gray-200">Add exciting prizes for your cadets.</p>

      <div className="mb-6 space-y-4 rounded-2xl bg-[#0D3A5C] p-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#FFD369]">Reward Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Movie Night"
            className="w-full rounded-xl border-2 border-[#FFD369] bg-[#1A5FA0] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#FFD369]">Cost (GGPoints)</label>
          <input
            type="number"
            min={10}
            max={1000}
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
            className="w-full rounded-xl border-2 border-[#FFD369] bg-[#1A5FA0] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#FFD369]">Icon</label>
          <select
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            className="w-full rounded-xl border-2 border-[#FFD369] bg-[#1A5FA0] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
          >
            {EMOJIS.map((emoji) => (
              <option key={emoji} value={emoji}>
                {emoji}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm font-semibold text-red-300">{error}</p>}

        <button
          onClick={handleAddReward}
          className="w-full rounded-2xl bg-[#FFD369] py-3 font-bold text-[#0F4C7D] transition-colors hover:bg-[#FFC93F]"
        >
          Add Reward
        </button>
      </div>

      <h2 className="mb-3 text-xl font-bold text-[#FFD369]">Current Rewards</h2>
      <div className="space-y-3 rounded-2xl bg-[#0D3A5C] p-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="flex items-center justify-between">
            <div>
              <p className="text-lg">{reward.icon}</p>
              <p className="font-semibold">{reward.name}</p>
            </div>
            <span className="rounded-full bg-[#FFD369] px-3 py-1 text-sm font-bold text-[#0F4C7D]">{reward.cost} GG</span>
          </div>
        ))}
      </div>
    </div>
  );
}

