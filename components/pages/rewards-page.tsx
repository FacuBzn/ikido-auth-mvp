"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { RewardCard } from "@/components/reward-card"
import { ArrowLeft } from "lucide-react"

interface RewardsPageProps {
  onBack: () => void
  onRewardRedeemed: () => void
}

export function RewardsPage({ onBack, onRewardRedeemed }: RewardsPageProps) {
  const [currentPoints, setCurrentPoints] = useState(285)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)

  const rewards = [
    { id: 1, name: "Movie Ticket", cost: 300, emoji: "🎬", color: "from-pink-400 to-pink-500" },
    { id: 2, name: "Video Game", cost: 250, emoji: "🎮", color: "from-blue-400 to-blue-500" },
    { id: 3, name: "Toy Set", cost: 190, emoji: "🧸", color: "from-purple-400 to-purple-500" },
    { id: 4, name: "Gift Card", cost: 400, emoji: "🎁", color: "from-yellow-400 to-orange-400" },
    { id: 5, name: "Ice Cream", cost: 100, emoji: "🍦", color: "from-red-400 to-pink-400" },
    { id: 6, name: "Book Bundle", cost: 150, emoji: "📚", color: "from-green-400 to-teal-400" },
  ]

  const handleRedeem = (rewardId: number, cost: number) => {
    if (currentPoints >= cost) {
      setRedeemingId(rewardId)
      setTimeout(() => {
        setCurrentPoints((prev) => prev - cost)
        setRedeemingId(null)
        onRewardRedeemed()
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <button onClick={onBack} className="flex items-center text-white/70 hover:text-white transition font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">🏆 Available Rewards</h1>
          <p className="text-yellow-300 text-lg font-semibold">Your Points: {currentPoints}</p>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              isRedeemable={currentPoints >= reward.cost}
              isRedeeming={redeemingId === reward.id}
              onRedeem={() => handleRedeem(reward.id, reward.cost)}
            />
          ))}
        </div>

        {/* Info */}
        <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-6 text-center">
          <p className="text-base leading-relaxed">
            Complete your daily tasks to earn more GGPoints! Each reward unlocks amazing experiences. Choose wisely! 🌟
          </p>
        </Card>
      </div>
    </div>
  )
}
