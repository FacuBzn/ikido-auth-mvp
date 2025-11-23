"use client"

interface Reward {
  id: string
  name: string
  cost: number
  icon: string
}

interface ChildRewardsProps {
  childName: string
  ggPoints: number
  rewards: Reward[]
  onBack: () => void
  onRewardRedeemed: (rewardId: string, points: number) => void
}

export function ChildRewards({ childName, ggPoints, rewards, onBack, onRewardRedeemed }: ChildRewardsProps) {
  const handleRedeemReward = (reward: Reward) => {
    if (ggPoints >= reward.cost) {
      onRewardRedeemed(reward.id, reward.cost)
    }
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Rewards
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-2">{childName}</h2>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🪙</span>
        <p className="text-xl font-bold text-[#FFD369]">{ggPoints} GG</p>
      </div>

      {/* Add New Task Button */}
      <button
        onClick={onBack}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl mb-6 transition-colors"
      >
        ← Back
      </button>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {rewards.map((reward) => (
          <button
            key={reward.id}
            onClick={() => handleRedeemReward(reward)}
            disabled={ggPoints < reward.cost}
            className={`rounded-2xl p-4 text-center font-bold transition-all ${
              ggPoints >= reward.cost
                ? "bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] cursor-pointer"
                : "bg-[#0D3A5C] text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="text-3xl mb-2">{reward.icon}</div>
            <p className="text-sm font-bold">{reward.name}</p>
            <p className="text-lg font-bold text-[#0F4C7D]">{reward.cost} GG</p>
          </button>
        ))}
      </div>
    </div>
  )
}
