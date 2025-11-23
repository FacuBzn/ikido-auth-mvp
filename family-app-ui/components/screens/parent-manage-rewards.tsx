"use client"

import { useState } from "react"

interface Reward {
  id: string
  name: string
  cost: number
  icon: string
}

interface ParentManageRewardsProps {
  onBack: () => void
  rewards: Reward[]
  onAddReward: (reward: Omit<Reward, "id">) => void
}

export function ParentManageRewards({ onBack, rewards, onAddReward }: ParentManageRewardsProps) {
  const [showForm, setShowForm] = useState(false)
  const [rewardName, setRewardName] = useState("")
  const [rewardCost, setRewardCost] = useState("")
  const [rewardIcon, setRewardIcon] = useState("🎁")
  const [error, setError] = useState("")

  const handleAddReward = () => {
    if (!rewardName.trim() || !rewardCost.trim()) {
      setError("Please fill in all fields")
      return
    }

    const cost = Number.parseInt(rewardCost)
    if (isNaN(cost) || cost <= 0) {
      setError("Cost must be a positive number")
      return
    }

    onAddReward({
      name: rewardName,
      cost,
      icon: rewardIcon,
    })

    setRewardName("")
    setRewardCost("")
    setRewardIcon("🎁")
    setShowForm(false)
    setError("")
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <button onClick={onBack} className="text-[#FFD369] font-bold mb-4 flex items-center gap-2 hover:opacity-80">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-[#FFD369] mb-6">Manage Rewards</h2>

      {!showForm ? (
        <>
          {/* Rewards List */}
          <div className="bg-[#0D3A5C] rounded-2xl p-4 space-y-3 mb-6 max-h-96 overflow-y-auto">
            {rewards.length === 0 ? (
              <p className="text-gray-300 text-center">No rewards yet</p>
            ) : (
              rewards.map((reward) => (
                <div key={reward.id} className="flex justify-between items-center border-b border-[#1A5FA0] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <p className="font-semibold">{reward.name}</p>
                      <p className="text-sm text-[#FFD369]">{reward.cost} GG</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-4 rounded-2xl transition-colors"
          >
            Add New Reward
          </button>
        </>
      ) : (
        <>
          {/* Add Reward Form */}
          <div className="space-y-4 mb-6">
            <div className="bg-[#0D3A5C] rounded-2xl p-4">
              <label className="block text-sm font-bold text-[#FFD369] mb-2">Reward Name</label>
              <input
                type="text"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                placeholder="e.g., Movie Night"
                className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
              />
            </div>

            <div className="bg-[#0D3A5C] rounded-2xl p-4">
              <label className="block text-sm font-bold text-[#FFD369] mb-2">Cost (GGPoints)</label>
              <input
                type="number"
                value={rewardCost}
                onChange={(e) => setRewardCost(e.target.value)}
                placeholder="e.g., 300"
                className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
              />
            </div>

            <div className="bg-[#0D3A5C] rounded-2xl p-4">
              <label className="block text-sm font-bold text-[#FFD369] mb-2">Icon Emoji</label>
              <input
                type="text"
                value={rewardIcon}
                onChange={(e) => setRewardIcon(e.target.value)}
                maxLength={2}
                className="w-full bg-[#1A5FA0] text-white placeholder-gray-400 border-2 border-[#FFD369] rounded-xl px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFD369]"
              />
            </div>

            {error && <p className="text-red-400 text-center font-semibold">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-[#0D3A5C] hover:bg-[#0A2A47] text-white font-bold py-3 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddReward}
              className="flex-1 bg-[#FFD369] hover:bg-[#FFC93F] text-[#0F4C7D] font-bold py-3 rounded-2xl transition-colors"
            >
              Add Reward
            </button>
          </div>
        </>
      )}
    </div>
  )
}
