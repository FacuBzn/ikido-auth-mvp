"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reward {
  id: number;
  name: string;
  cost: number;
  emoji: string;
  color: string;
}

interface RewardCardProps {
  reward: Reward;
  isRedeemable: boolean;
  isRedeeming: boolean;
  onRedeem: () => void;
}

export function RewardCard({ reward, isRedeemable, isRedeeming, onRedeem }: RewardCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 px-6 py-6 text-center transition duration-300",
        isRedeemable ? "glass-panel text-[var(--brand-blue-900)]" : "glass-panel text-[var(--brand-blue-900)] opacity-70"
      )}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${reward.color} opacity-40`}
      />
      <span className="pointer-events-none absolute -top-12 right-4 size-36 rounded-full bg-white/60 blur-3xl" />

      <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-white/60 bg-white/80 text-5xl shadow-[0_24px_36px_-24px_rgba(11,38,71,0.45)]">
        {reward.emoji}
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-xl font-bold tracking-tight">{reward.name}</h3>
        <p className="badge-points mx-auto text-xs">
          <Sparkles className="mr-1 size-3.5" />
          {reward.cost} GGPoints
        </p>
      </div>

      <div className="mt-6">
        <Button
          onClick={onRedeem}
          disabled={!isRedeemable || isRedeeming}
          className={cn(
            "w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition duration-200",
            isRedeemable
              ? "bg-white text-[var(--brand-blue-900)] hover:bg-white/90"
              : "bg-white/40 text-[var(--brand-blue-900)]/70"
          )}
        >
          {isRedeeming ? (
            <>
              <Loader className="mr-2 size-4 animate-spin" />
              Redeeming…
            </>
          ) : isRedeemable ? (
            "Redeem reward"
          ) : (
            "Need more points"
          )}
        </Button>
      </div>
    </Card>
  );
}
