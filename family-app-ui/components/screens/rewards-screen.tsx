"use client"

interface RewardsScreenProps {
  onBack: () => void
  onRewardRedeemed: (points: number) => void
}

export function RewardsScreen({ onBack, onRewardRedeemed }: RewardsScreenProps) {
  const rewards = [
    { name: "Movie", points: 300, icon: "🎟️", color: "#FFD369" },
    { name: "Game", points: 250, icon: "🎮", color: "#6B8ECF" },
    { name: "Toy", points: 190, icon: "🤖", color: "#E07B39" },
    { name: "Gift", points: 400, icon: "🎁", color: "#E07B39" },
  ]

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-2xl hover:opacity-80">
          ←
        </button>
        <h1 className="text-3xl font-bold">Rewards</h1>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {rewards.map((reward, index) => (
          <button
            key={index}
            onClick={() => onRewardRedeemed(reward.points)}
            className="bg-[#0D3A5C] hover:bg-[#0A2A47] rounded-2xl p-4 text-center transition-colors group cursor-pointer"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{reward.icon}</div>
            <p className="font-bold text-white mb-2">{reward.name}</p>
            <div className="bg-[#FFD369] text-[#0F4C7D] rounded-lg py-2 font-bold">{reward.points} GG</div>
          </button>
        ))}
      </div>

      {/* Bottom Button */}
      <button className="w-full bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-full transition-colors">
        Rewards
      </button>
    </div>
  )
}
