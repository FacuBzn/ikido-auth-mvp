"use client"

import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

interface RewardCardProps {
  icon: string
  title: string
  cost: number
  userPoints: number
  selected?: boolean
  onSelect?: () => void
  className?: string
}

export function RewardCard({ icon, title, cost, userPoints, selected, onSelect, className }: RewardCardProps) {
  const canAfford = userPoints >= cost

  return (
    <button
      onClick={onSelect}
      className={cn(
        "bg-[var(--ik-surface-1)] border-3 rounded-[var(--ik-radius-card)] p-4 flex flex-col items-center text-center transition-all relative",
        selected
          ? "border-[var(--ik-accent-yellow)] bg-[var(--ik-surface-2)]"
          : "border-[var(--ik-outline-light)] hover:border-[var(--ik-accent-cyan)]",
        className,
      )}
    >
      {!canAfford && (
        <div className="absolute top-2 right-2 bg-[var(--ik-surface-2)] text-[var(--ik-text-muted)] text-[10px] font-bold px-2 py-0.5 rounded-full">
          Not enough
        </div>
      )}

      <div className="text-5xl mb-2">{icon}</div>
      <div className="font-bold text-white mb-2">{title}</div>

      <div className="flex items-center gap-2">
        <span className="bg-[var(--ik-accent-yellow)] text-[var(--ik-text-dark)] text-xs font-bold px-3 py-1 rounded-full">
          {cost} GG
        </span>
        {!canAfford && <Lock className="w-4 h-4 text-[var(--ik-text-muted)]" />}
      </div>
    </button>
  )
}
