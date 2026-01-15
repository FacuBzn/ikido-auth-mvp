"use client";

import type { ReactNode } from "react";
import { Gift, Lock } from "lucide-react";

export interface RewardCardProps {
  id: string;
  name: string;
  cost: number;
  claimed: boolean;
  icon?: ReactNode;
  currentPoints: number;
  isLoading?: boolean;
  onClaim: (id: string) => void;
}

/**
 * Reward card component with IKIDO styling
 * Shows reward name, cost, and claim button
 */
export function RewardCard({
  id,
  name,
  cost,
  claimed,
  icon,
  currentPoints,
  isLoading = false,
  onClaim,
}: RewardCardProps) {
  const canAfford = currentPoints >= cost;
  const isDisabled = claimed || !canAfford || isLoading;

  return (
    <div
      className={`bg-[var(--ik-surface-1)] border-2 rounded-xl p-4 transition-all ${
        claimed
          ? "border-green-500/30 opacity-60"
          : canAfford
          ? "border-[var(--ik-accent-yellow)]/50 hover:border-[var(--ik-accent-yellow)]"
          : "border-[var(--ik-outline-light)] opacity-70"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
          claimed
            ? "bg-green-500/20"
            : canAfford
            ? "bg-[var(--ik-accent-cyan)]/20"
            : "bg-[var(--ik-surface-2)]"
        }`}
      >
        {icon || (
          <Gift
            className={`w-6 h-6 ${
              claimed
                ? "text-green-400"
                : canAfford
                ? "text-[var(--ik-accent-cyan)]"
                : "text-[var(--ik-text-muted)]"
            }`}
          />
        )}
      </div>

      {/* Name */}
      <h3
        className={`font-bold text-sm mb-2 line-clamp-2 ${
          claimed ? "text-white/60 line-through" : "text-white"
        }`}
      >
        {name}
      </h3>

      {/* Cost Chip */}
      <div
        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${
          claimed
            ? "bg-green-500/20 text-green-400"
            : canAfford
            ? "bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)]"
            : "bg-[var(--ik-surface-2)] text-[var(--ik-text-muted)]"
        }`}
      >
        🪙 {cost} GG
      </div>

      {/* Action Button / Status */}
      {claimed ? (
        <div className="w-full py-2 text-center text-green-400 text-xs font-bold">
          ✓ Claimed
        </div>
      ) : canAfford ? (
        <button
          onClick={() => onClaim(id)}
          disabled={isDisabled}
          className={`w-full ik-btn-primary py-2 text-sm font-bold transition-all ${
            isLoading ? "opacity-50 cursor-wait" : ""
          }`}
        >
          {isLoading ? "..." : "Claim"}
        </button>
      ) : (
        <div className="w-full py-2 text-center text-[var(--ik-text-muted)] text-xs flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Not enough</span>
        </div>
      )}
    </div>
  );
}

export default RewardCard;
