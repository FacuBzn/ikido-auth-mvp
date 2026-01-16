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
} from "@/components/ikido";
import { Modal } from "@/components/ikido/modal";
import { ArrowLeft, Gift, RefreshCw, Clock, Check } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Reward type from API (PR13: includes status field)
 */
type RewardFromAPI = {
  id: string;
  name: string;
  cost: number;
  status: "available" | "requested" | "approved" | "rejected";
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  requested_at: string | null;
  reject_reason: string | null;
};

/**
 * V2 Child Rewards Page
 * Request-based rewards shop (parent must approve claims)
 * Uses:
 * - POST /api/child/rewards (list rewards + ggpoints)
 * - POST /api/child/rewards/request (request a reward - NO immediate point deduction)
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
  const [requestingRewardId, setRequestingRewardId] = useState<string | null>(null);

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
      // Map old rewards to include status field if missing
      const mappedRewards: RewardFromAPI[] = ((data.rewards || []) as RewardFromAPI[]).map((r) => ({
        ...r,
        status: r.status || (r.claimed ? "approved" : "available"),
      }));
      
      // Defensive dedupe by id (in case DB has duplicates)
      const uniqueRewards: RewardFromAPI[] = Array.from(
        new Map(mappedRewards.map((r) => [r.id, r] as [string, RewardFromAPI])).values()
      );
      setRewards(uniqueRewards);
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

  // Handle request click
  const handleRequestClick = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (reward && reward.status === "available" && ggpoints >= reward.cost) {
      setConfirmReward(reward);
    }
  };

  // Confirm request (or fallback to direct claim if feature not available)
  const handleConfirmRequest = async () => {
    if (!confirmReward || !child?.child_code || !child?.family_code) return;

    const rewardId = confirmReward.id;
    const rewardName = confirmReward.name;

    setRequestingRewardId(rewardId);
    setError(null);
    setConfirmReward(null);

    try {
      // Try request endpoint first (PR13 flow)
      const response = await fetch("/api/child/rewards/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reward_id: rewardId,
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      const data = await response.json();

      // If feature not available (migration not run), fallback to direct claim
      if (response.status === 501 && data.error === "FEATURE_NOT_AVAILABLE") {
        console.log("[V2 ChildRewards] Request feature not available, using direct claim");
        
        // Fallback to claim endpoint
        const claimResponse = await fetch("/api/child/rewards/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reward_id: rewardId,
            child_code: child.child_code,
            family_code: child.family_code,
          }),
        });

        const claimData = await claimResponse.json();

        if (!claimResponse.ok) {
          if (claimData.error === "INSUFFICIENT_POINTS") {
            if (claimData.ggpoints !== undefined) {
              setGgpoints(claimData.ggpoints);
            }
            throw new Error(claimData.message || "Not enough GGPoints");
          }
          throw new Error(claimData.message || "Failed to claim reward");
        }

        // Update points
        if (claimData.ggpoints !== undefined) {
          setGgpoints(claimData.ggpoints);
        }

        setSuccessMessage(`Claimed "${rewardName}"!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchRewards();
        return;
      }

      // Handle error responses for request endpoint
      if (!response.ok) {
        if (data.error === "INSUFFICIENT_POINTS") {
          if (data.ggpoints !== undefined) {
            setGgpoints(data.ggpoints);
          }
          throw new Error(data.message || "Not enough GGPoints");
        }

        if (data.error === "INVALID_STATUS") {
          await fetchRewards();
          throw new Error(data.message || "This reward is not available");
        }

        throw new Error(data.message || "Failed to request reward");
      }

      // Update points from server
      if (data.ggpoints !== undefined) {
        setGgpoints(data.ggpoints);
      }

      // Handle already_requested (idempotent)
      if (data.already_requested) {
        console.log("[V2 ChildRewards] Reward already requested");
        await fetchRewards();
        return;
      }

      // Show success
      setSuccessMessage(`Requested "${rewardName}"! Waiting for parent approval.`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refetch to update status
      await fetchRewards();
    } catch (err) {
      console.error("[V2 ChildRewards] Failed to request:", err);
      setError(err instanceof Error ? err.message : "Failed to request reward");
    } finally {
      setRequestingRewardId(null);
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

  // Categorize rewards by status
  const availableRewards = rewards.filter((r) => r.status === "available");
  const requestedRewards = rewards.filter((r) => r.status === "requested");
  const approvedRewards = rewards.filter((r) => r.status === "approved");
  const rejectedRewards = rewards.filter((r) => r.status === "rejected");

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
            <div className="text-right text-xs text-[var(--ik-text-muted)]">
              <p>{availableRewards.length} available</p>
              <p>{requestedRewards.length} pending</p>
              <p>{approvedRewards.length} claimed</p>
            </div>
          </div>
        </PanelCard>

        {/* Loading State */}
        {isLoadingRewards && rewards.length === 0 && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
            <span className="text-[var(--ik-text-muted)]">Loading rewards...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingRewards && rewards.length === 0 && !error && (
          <PanelCard className="text-center py-8">
            <div className="text-4xl mb-3">🎁</div>
            <p className="text-[var(--ik-text-muted)]">No rewards yet</p>
            <p className="text-[var(--ik-text-muted)] text-sm mt-1">
              Ask your parent to add some rewards!
            </p>
          </PanelCard>
        )}

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <PanelCard className="space-y-4">
            <h2 className="text-lg font-bold text-white">Available Rewards</h2>
            <div className="grid grid-cols-2 gap-3">
              {availableRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={ggpoints}
                  isLoading={requestingRewardId === reward.id}
                  onRequest={() => handleRequestClick(reward.id)}
                />
              ))}
            </div>
          </PanelCard>
        )}

        {/* Requested (Pending) Rewards */}
        {requestedRewards.length > 0 && (
          <PanelCard className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
              <h2 className="text-lg font-bold text-[var(--ik-accent-yellow)]">Awaiting Approval</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {requestedRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={ggpoints}
                  isLoading={false}
                />
              ))}
            </div>
          </PanelCard>
        )}

        {/* Rejected Rewards (can be re-requested) */}
        {rejectedRewards.length > 0 && (
          <PanelCard className="space-y-4">
            <h2 className="text-lg font-bold text-red-400">Rejected</h2>
            <p className="text-[var(--ik-text-muted)] text-xs">You can request these again</p>
            <div className="grid grid-cols-2 gap-3">
              {rejectedRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={ggpoints}
                  isLoading={requestingRewardId === reward.id}
                  onRequest={() => handleRequestClick(reward.id)}
                  showRejected
                />
              ))}
            </div>
          </PanelCard>
        )}

        {/* Claimed Rewards */}
        {approvedRewards.length > 0 && (
          <PanelCard className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-green-400">Claimed</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {approvedRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentPoints={ggpoints}
                  isLoading={false}
                />
              ))}
            </div>
          </PanelCard>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={!!confirmReward}
        onClose={() => setConfirmReward(null)}
        title=""
        showCloseButton={true}
        variant="solid"
      >
        {/* Header */}
        <div className="flex items-start justify-between -mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[var(--ik-accent-cyan)]" />
            </div>
            <h3 className="text-lg font-bold text-white">Request Reward?</h3>
          </div>
        </div>

        {/* Reward Info */}
        {confirmReward && (
          <>
            <div className="bg-[#1B263B] border-2 border-[#415A77] rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#1B263B" }}>
              <p className="text-white font-bold text-lg">{confirmReward.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[var(--ik-accent-yellow)] font-bold text-xl">
                  🪙 {confirmReward.cost} GG
                </span>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-center text-sm bg-[#1B263B] border-2 border-[#415A77] rounded-xl p-4" style={{ backgroundColor: "#1B263B" }}>
              <p className="text-[var(--ik-accent-cyan)] font-semibold">
                Your parent will need to approve this request.
              </p>
              <p className="text-white text-xs mt-2">
                Points will be deducted after approval.
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <SecondaryButton onClick={() => setConfirmReward(null)} fullWidth>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleConfirmRequest}
            fullWidth
            disabled={requestingRewardId !== null}
            loading={requestingRewardId === confirmReward?.id}
          >
            Request
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

// === RewardCard Component ===

function RewardCard({
  reward,
  currentPoints,
  isLoading,
  onRequest,
  showRejected,
}: {
  reward: RewardFromAPI;
  currentPoints: number;
  isLoading: boolean;
  onRequest?: () => void;
  showRejected?: boolean;
}) {
  const canAfford = currentPoints >= reward.cost;
  const isAvailable = reward.status === "available" || (showRejected && reward.status === "rejected");
  const isRequested = reward.status === "requested";
  const isApproved = reward.status === "approved";
  const isRejected = reward.status === "rejected";

  // Status badge colors
  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
          ✓ Claimed
        </span>
      );
    }
    if (isRequested) {
      return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)]">
          ⏳ Pending
        </span>
      );
    }
    if (isRejected && !showRejected) {
      return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
          ✗ Rejected
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`
        bg-[var(--ik-surface-1)] border-2 rounded-[var(--ik-radius-card)] p-4 
        flex flex-col items-center text-center transition-all relative
        ${isApproved ? "border-green-500/50 opacity-60" : ""}
        ${isRequested ? "border-[var(--ik-accent-yellow)]/50" : ""}
        ${isRejected && showRejected ? "border-red-500/30" : ""}
        ${isAvailable && !isRejected ? "border-[var(--ik-outline-light)]" : ""}
      `}
    >
      {/* Status Badge */}
      {getStatusBadge() && (
        <div className="absolute top-2 right-2">{getStatusBadge()}</div>
      )}

      {/* Not enough indicator */}
      {isAvailable && !canAfford && (
        <div className="absolute top-2 left-2 bg-[var(--ik-surface-2)] text-[var(--ik-text-muted)] text-[10px] font-bold px-2 py-0.5 rounded-full">
          Not enough
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-2">🎁</div>

      {/* Name */}
      <div className="font-bold text-white mb-2 text-sm">{reward.name}</div>

      {/* Cost */}
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-[var(--ik-accent-yellow)] text-[var(--ik-text-dark)] text-xs font-bold px-3 py-1 rounded-full">
          {reward.cost} GG
        </span>
      </div>

      {/* Rejection reason */}
      {isRejected && reward.reject_reason && (
        <p className="text-red-400 text-xs mb-2">&ldquo;{reward.reject_reason}&rdquo;</p>
      )}

      {/* Action Button */}
      {isAvailable && onRequest && (
        <button
          onClick={onRequest}
          disabled={!canAfford || isLoading}
          className={`
            w-full py-2 px-4 rounded-xl font-bold text-sm transition-all
            ${canAfford && !isLoading
              ? "bg-[var(--ik-accent-cyan)] text-[var(--ik-bg-dark)] hover:opacity-90"
              : "bg-[var(--ik-surface-2)] text-[var(--ik-text-muted)] cursor-not-allowed"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-[var(--ik-bg-dark)] border-t-transparent rounded-full" />
              Requesting...
            </span>
          ) : showRejected ? (
            "Request Again"
          ) : (
            "Request"
          )}
        </button>
      )}
    </div>
  );
}
