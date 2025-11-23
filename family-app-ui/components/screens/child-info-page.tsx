"use client"

interface ChildInfo {
  name: string
  points: number
  redeemedRewards: Array<{ id: string; name: string; redeemedDate: string }>
}

interface ChildInfoPageProps {
  child: ChildInfo
  onBack: () => void
}

export function ChildInfoPage({ child, onBack }: ChildInfoPageProps) {
  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">{child.name}</h2>

      {/* Child Avatar and Points */}
      <div className="bg-[#FFF8DC] rounded-2xl p-5 mb-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="text-5xl">😊</div>
        </div>
        <p className="text-3xl font-bold text-[#0F4C7D] mb-1">{child.points}</p>
        <p className="text-lg font-bold text-[#0F4C7D]">GGPoints</p>
      </div>

      {/* Redeemed Rewards */}
      <h3 className="text-xl font-bold text-[#FFD369] mb-4">Redeemed Rewards</h3>
      <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
        {child.redeemedRewards.length === 0 ? (
          <p className="text-gray-300 text-center">No rewards redeemed yet</p>
        ) : (
          child.redeemedRewards.map((reward) => (
            <div key={reward.id} className="border-b border-[#1A5FA0] pb-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{reward.name}</p>
                  <p className="text-xs text-gray-400">{reward.redeemedDate}</p>
                </div>
                <div className="text-[#FFD369] text-xl">✓</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
