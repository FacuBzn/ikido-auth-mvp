"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader } from "lucide-react"

interface Reward {
  id: number
  name: string
  cost: number
  emoji: string
  color: string
}

interface RewardCardProps {
  reward: Reward
  isRedeemable: boolean
  isRedeeming: boolean
  onRedeem: () => void
}

export function RewardCard({ reward, isRedeemable, isRedeeming, onRedeem }: RewardCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br ${reward.color} border-0 shadow-lg overflow-hidden transition ${
        isRedeemable ? "hover:shadow-xl" : "opacity-60"
      }`}
    >
      <div className="p-6 text-white text-center space-y-4">
        <div className="text-6xl">{reward.emoji}</div>
        <div>
          <h3 className="text-xl font-bold mb-1">{reward.name}</h3>
          <p className="text-white/90 text-lg font-semibold">{reward.cost} GGPoints</p>
        </div>
        <Button
          onClick={onRedeem}
          disabled={!isRedeemable || isRedeeming}
          className={`w-full font-bold py-2 transition ${
            isRedeemable ? "bg-white text-gray-900 hover:bg-white/90" : "bg-white/30 text-white cursor-not-allowed"
          }`}
        >
          {isRedeeming ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Redeeming...
            </>
          ) : isRedeemable ? (
            "Redeem"
          ) : (
            "Not Enough Points"
          )}
        </Button>
      </div>
    </Card>
  )
}
