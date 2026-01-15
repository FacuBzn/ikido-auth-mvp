"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  SecondaryButton,
  PrimaryButton,
  PointsPill,
  RewardCard,
} from "@/components/ikido";
import { ArrowLeft, Gift, RefreshCw, X } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Reward type from API
 */
type RewardFromAPI = {
  id: string;
  name: string;
  cost: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
};

/**
 * V2 Child Rewards Page
 * Full rewards shop with claim functionality
 * Uses:
 * - POST /api/child/rewards (list rewards + ggpoints)
 * - POST /api/child/rewards/claim (claim a reward)
 */
export default function V2ChildRewardsPage() {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  // Data states
  const [rewards, setRewards] = useState<RewardFromAPI[]>([]);
  const [ggpoints, setGgpoints] = useState<number>(0);

  // Loading states
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Confirm modal state
  const [confirmReward, setConfirmReward] = useState<RewardFromAPI | null>(null);

  // Success feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auth guard - redirect if no child session
  useEffect(() => {
    if (hasHydrated && !child) {
      router.replace("/v2/child/join");
    }
  }, [child, hasHydrated, router]);

  // Fetch rewards from API
  const fetchRewards = useCallback(async () => {
    if (!child?.child_code || !child?.family_code) return;

    setIsLoadingRewards(true);
    setError(null);

    try {
      const response = await fetch("/api/child/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load rewards");
      }

      const data = await response.json();
      setRewards(data.rewards || []);
      setGgpoints(data.ggpoints || 0);
    } catch (err) {
      console.error("[V2 ChildRewards] Failed to load rewards:", err);
      setError(err instanceof Error ? err.message : "Failed to load rewards");
    } finally {
      setIsLoadingRewards(false);
    }
  }, [child?.child_code, child?.family_code]);

  // Load data when child is available
  useEffect(() => {
    if (hasHydrated && child) {
      void fetchRewards();
    }
  }, [hasHydrated, child, fetchRewards]);

  // Handle claim
  const handleClaimClick = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (reward && !reward.claimed && ggpoints >= reward.cost) {
      setConfirmReward(reward);
    }
  };

  // Confirm claim
  const handleConfirmClaim = async () => {
    if (!confirmReward || !child?.child_code || !child?.family_code) return;

    const rewardId = confirmReward.id;
    const rewardName = confirmReward.name;
    const rewardCost = confirmReward.cost;

    setClaimingRewardId(rewardId);
    setError(null);

    // Optimistic update
    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId
          ? { ...r, claimed: true, claimed_at: new Date().toISOString() }
          : r
      )
    );
    setGgpoints((prev) => prev - rewardCost);
    setConfirmReward(null);

    try {
      const response = await fetch("/api/child/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reward_id: rewardId,
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        // Special handling for insufficient points
        if (data.error === "INSUFFICIENT_POINTS") {
          // Update points from server (may have changed)
          if (data.ggpoints !== undefined) {
            setGgpoints(data.ggpoints);
          }
          throw new Error(data.message || "Not enough GGPoints");
        }
        throw new Error(data.message || "Failed to claim reward");
      }

      // Update with server data
      setGgpoints(data.ggpoints);

      // Handle already_claimed case (idempotent - not an error)
      if (data.already_claimed) {
        console.log("[V2 ChildRewards] Reward was already claimed (race condition handled)");
        // Just refetch to sync state, no error shown
        await fetchRewards();
        return;
      }

      // Show success for new claim
      setSuccessMessage(`Claimed "${rewardName}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refetch to ensure consistency
      await fetchRewards();
    } catch (err) {
      console.error("[V2 ChildRewards] Failed to claim:", err);

      // Revert optimistic update
      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId ? { ...r, claimed: false, claimed_at: null } : r
        )
      );
      setGgpoints((prev) => prev + rewardCost);

      setError(err instanceof Error ? err.message : "Failed to claim reward");
    } finally {
      setClaimingRewardId(null);
    }
  };

  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect in progress or no child
  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Separate available and claimed rewards
  const availableRewards = rewards.filter((r) => !r.claimed);
  const claimedRewards = rewards.filter((r) => r.claimed);

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/v2/child/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <PointsPill points={ggpoints} loading={isLoadingRewards} />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
            <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">
              Rewards Shop
            </h1>
          </div>
          <SecondaryButton
            onClick={() => void fetchRewards()}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={isLoadingRewards}
          >
            Refresh
          </SecondaryButton>
        </div>

        {/* Success Feedback */}
        {successMessage && (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <Gift className="w-6 h-6 text-green-400 shrink-0" />
            <span className="text-green-400 font-bold">{successMessage}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-white font-bold">Error</p>
              <p className="text-white/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <PanelCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                Your Balance
              </p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-[var(--ik-accent-yellow)]">
                  {isLoadingRewards ? "..." : ggpoints}
                </span>
                <span className="text-[var(--ik-accent-cyan)] text-sm font-bold">
                  🪙 GGPOINTS
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[var(--ik-text-muted)] text-xs">
                {availableRewards.length} available
              </p>
              <p className="text-[var(--ik-text-muted)] text-xs">
                {claimedRewards.length} claimed
              </p>
            </div>
          </div>
        </PanelCard>

        {/* Rewards Section */}
        <PanelCard className="space-y-4">
          <h2 className="text-lg font-bold text-white">Available Rewards</h2>

          {/* Loading State */}
          {isLoadingRewards && rewards.length === 0 && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
              <span className="text-[var(--ik-text-muted)]">
                Loading rewards...
              </span>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingRewards && rewards.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-[var(--ik-text-muted)]">No rewards yet</p>
              <p className="text-[var(--ik-text-muted)] text-sm mt-1">
                Ask your parent to add some rewards!
              </p>
            </div>
          )}

          {/* Rewards Grid */}
          {rewards.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {/* Available first */}
              {availableRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  id={reward.id}
                  name={reward.name}
                  cost={reward.cost}
                  claimed={reward.claimed}
                  currentPoints={ggpoints}
                  isLoading={claimingRewardId === reward.id}
                  onClaim={handleClaimClick}
                />
              ))}
              {/* Claimed after */}
              {claimedRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  id={reward.id}
                  name={reward.name}
                  cost={reward.cost}
                  claimed={reward.claimed}
                  currentPoints={ggpoints}
                  isLoading={false}
                  onClaim={() => {}}
                />
              ))}
            </div>
          )}
        </PanelCard>

      </div>

      {/* Confirm Modal */}
      {confirmReward && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--ik-bg-dark)] border-2 border-[var(--ik-accent-yellow)] rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[var(--ik-accent-cyan)]" />
                </div>
                <h3 className="text-lg font-bold text-white">Claim Reward?</h3>
              </div>
              <button
                onClick={() => setConfirmReward(null)}
                className="text-[var(--ik-text-muted)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reward Info */}
            <div className="bg-[var(--ik-surface-1)] rounded-xl p-4 space-y-2">
              <p className="text-white font-bold">{confirmReward.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[var(--ik-accent-yellow)] font-bold">
                  🪙 {confirmReward.cost} GG
                </span>
              </div>
            </div>

            {/* Balance Info */}
            <div className="text-center text-sm">
              <p className="text-[var(--ik-text-muted)]">
                Your balance after:{" "}
                <span className="text-[var(--ik-accent-yellow)] font-bold">
                  {ggpoints - confirmReward.cost} GG
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <SecondaryButton
                onClick={() => setConfirmReward(null)}
                fullWidth
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={handleConfirmClaim}
                fullWidth
                disabled={claimingRewardId !== null}
                loading={claimingRewardId === confirmReward.id}
              >
                Claim
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
