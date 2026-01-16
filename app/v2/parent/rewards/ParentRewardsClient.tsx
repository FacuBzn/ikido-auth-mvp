"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from "@/components/ikido";
import { Modal } from "@/components/ikido/modal";
import {
  ArrowLeft,
  LogOut,
  Gift,
  RefreshCw,
  ChevronDown,
  User,
  Plus,
  Trash2,
  Edit2,
  Check,
  XCircle,
  Clock,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

type ChildForSelector = {
  id: string;
  name: string;
  points_balance: number;
};

type RewardFromAPI = {
  id: string;
  name: string;
  cost: number;
  status: "available" | "requested" | "approved" | "rejected";
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
};

interface ParentRewardsClientProps {
  childrenList: ChildForSelector[];
  initialChildId: string;
}

type TabType = "rewards" | "claims";

export function ParentRewardsClient({
  childrenList,
  initialChildId,
}: ParentRewardsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logout = useSessionStore((state) => state.logout);

  // State
  const [selectedChildId, setSelectedChildId] = useState(initialChildId);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("rewards");

  // Data
  const [rewards, setRewards] = useState<RewardFromAPI[]>([]);
  const [claims, setClaims] = useState<RewardFromAPI[]>([]);
  const [ggpoints, setGgpoints] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [actionRewardId, setActionRewardId] = useState<string | null>(null);

  // Error/success
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardFromAPI | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCost, setFormCost] = useState("50");

  // Sync URL with selected child
  useEffect(() => {
    const urlChildId = searchParams.get("childId");
    if (urlChildId && urlChildId !== selectedChildId) {
      setSelectedChildId(urlChildId);
    }
  }, [searchParams, selectedChildId]);

  // Fetch rewards
  const fetchRewards = useCallback(async () => {
    if (!selectedChildId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/parent/rewards/list?child_id=${encodeURIComponent(selectedChildId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to load rewards");
      const data = await response.json();
      // Defensive dedupe by id (in case DB has duplicates)
      const rawRewards: RewardFromAPI[] = data.rewards || [];
      const uniqueRewards: RewardFromAPI[] = Array.from(
        new Map(rawRewards.map((r) => [r.id, r] as [string, RewardFromAPI])).values()
      );
      setRewards(uniqueRewards);
      setGgpoints(data.ggpoints ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [selectedChildId]);

  // Fetch claims
  const fetchClaims = useCallback(async () => {
    if (!selectedChildId) return;

    try {
      const response = await fetch(
        `/api/parent/rewards/claims/list?child_id=${encodeURIComponent(selectedChildId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to load claims");
      const data = await response.json();
      setClaims(data.claims || []);
      if (data.ggpoints !== undefined) {
        setGgpoints(data.ggpoints);
      }
    } catch (err) {
      console.error("[ParentRewards] Failed to fetch claims:", err);
    }
  }, [selectedChildId]);

  // Seed default rewards for all children on mount (idempotent, runs once)
  useEffect(() => {
    let mounted = true;

    const seedAllDefaults = async () => {
      try {
        console.log("[ParentRewards] Seeding default rewards for all children...");
        const response = await fetch("/api/parent/rewards/seed-defaults/all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        
        if (response.ok && mounted) {
          const data = await response.json();
          console.log("[ParentRewards] Seeded defaults:", data);
        }
      } catch (err) {
        console.error("[ParentRewards] Failed to seed defaults:", err);
        // Don't show error to user - this is a background operation
      }
    };

    // Only seed once on mount
    void seedAllDefaults();

    return () => {
      mounted = false;
    };
  }, []); // Empty deps = runs once on mount

  // Load data on mount and child change
  useEffect(() => {
    if (selectedChildId) {
      void fetchRewards();
      void fetchClaims();
    }
  }, [selectedChildId, fetchRewards, fetchClaims]);

  // Handle child selection
  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    setShowChildDropdown(false);
    router.push(`/v2/parent/rewards?childId=${childId}`);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/v2/parent/login");
    router.refresh();
  };

  // === CRUD Operations ===

  // Create reward
  const handleCreate = async () => {
    if (!formName.trim() || !selectedChildId) return;
    const cost = parseInt(formCost, 10);
    if (isNaN(cost) || cost < 1 || cost > 9999) {
      setError("Cost must be between 1 and 9999");
      return;
    }

    setActionRewardId("create");
    setError(null);

    try {
      const response = await fetch("/api/parent/rewards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          name: formName.trim(),
          cost,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create");
      }

      setSuccessMessage("Reward created!");
      setTimeout(() => setSuccessMessage(null), 2000);
      setShowCreateModal(false);
      setFormName("");
      setFormCost("50");
      await fetchRewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setActionRewardId(null);
    }
  };

  // Update reward
  const handleUpdate = async () => {
    if (!editingReward || !formName.trim()) return;
    const cost = parseInt(formCost, 10);
    if (isNaN(cost) || cost < 1 || cost > 9999) {
      setError("Cost must be between 1 and 9999");
      return;
    }

    setActionRewardId(editingReward.id);
    setError(null);

    try {
      const response = await fetch("/api/parent/rewards/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: editingReward.id,
          name: formName.trim(),
          ...(editingReward.status === "available" && { cost }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update");
      }

      setSuccessMessage("Reward updated!");
      setTimeout(() => setSuccessMessage(null), 2000);
      setEditingReward(null);
      setFormName("");
      setFormCost("50");
      await fetchRewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionRewardId(null);
    }
  };

  // Delete reward
  const handleDelete = async (reward: RewardFromAPI) => {
    if (!confirm(`Delete "${reward.name}"?`)) return;

    setActionRewardId(reward.id);
    setError(null);

    try {
      const response = await fetch("/api/parent/rewards/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete");
      }

      setSuccessMessage("Reward deleted!");
      setTimeout(() => setSuccessMessage(null), 2000);
      await fetchRewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionRewardId(null);
    }
  };

  // Approve claim
  const handleApprove = async (reward: RewardFromAPI) => {
    setActionRewardId(reward.id);
    setError(null);

    try {
      const response = await fetch("/api/parent/rewards/claims/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve");
      }

      // Update balance from response
      if (data.ggpoints !== undefined) {
        setGgpoints(data.ggpoints);
      }

      setSuccessMessage(`Approved "${reward.name}"! -${reward.cost} GG`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh both lists
      await Promise.all([fetchRewards(), fetchClaims()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionRewardId(null);
    }
  };

  // Reject claim
  const handleReject = async (reward: RewardFromAPI) => {
    const reason = prompt("Reason for rejection (optional):");

    setActionRewardId(reward.id);
    setError(null);

    try {
      const response = await fetch("/api/parent/rewards/claims/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id, reason: reason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reject");
      }

      setSuccessMessage(`Rejected "${reward.name}"`);
      setTimeout(() => setSuccessMessage(null), 2000);

      await Promise.all([fetchRewards(), fetchClaims()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionRewardId(null);
    }
  };

  // Open edit modal
  const openEditModal = (reward: RewardFromAPI) => {
    setEditingReward(reward);
    setFormName(reward.name);
    setFormCost(reward.cost.toString());
  };

  // Selected child info
  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  // Filter rewards by status
  const availableRewards = rewards.filter((r) => r.status === "available" || r.status === "rejected");
  const approvedRewards = rewards.filter((r) => r.status === "approved");

  // No children
  if (childrenList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/v2/parent/dashboard" className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </Link>
          <IkidoLogo />
          <div className="w-20" />
        </div>
        <PanelCard className="text-center py-12">
          <User className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">No children yet</p>
          <Link href="/v2/parent/dashboard" className="text-[var(--ik-accent-cyan)] text-sm underline mt-2 inline-block">
            Add a child first
          </Link>
        </PanelCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/v2/parent/dashboard" className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>
        <IkidoLogo />
        <button onClick={handleLogout} className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
            <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">Manage Rewards</h1>
          </div>
          <SecondaryButton
            onClick={() => { void fetchRewards(); void fetchClaims(); }}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={isLoading}
          >
            Refresh
          </SecondaryButton>
        </div>

        {/* Success/Error */}
        {successMessage && (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3 text-green-400 font-bold text-sm text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] rounded-xl p-3 text-white text-sm">
            <span className="font-bold">Error: </span>{error}
          </div>
        )}

        {/* Child Selector */}
        <PanelCard>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[var(--ik-text-muted)] text-xs">Select Child</p>
              <span className="text-[var(--ik-accent-yellow)] font-bold text-sm">🪙 {ggpoints} GG</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowChildDropdown(!showChildDropdown)}
                className="w-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-accent-yellow)]/50 rounded-xl p-4 flex items-center justify-between hover:border-[var(--ik-accent-yellow)] transition-colors"
              >
                <span className="text-white font-bold">{selectedChild?.name || "Choose..."}</span>
                <ChevronDown className={`w-5 h-5 text-[var(--ik-accent-yellow)] transition-transform ${showChildDropdown ? "rotate-180" : ""}`} />
              </button>
              {showChildDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {childrenList.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleSelectChild(child.id)}
                      className={`w-full p-4 text-left hover:bg-[var(--ik-surface-2)] transition-colors ${child.id === selectedChildId ? "bg-[var(--ik-accent-yellow)]/10" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{child.name}</span>
                        <span className="text-[var(--ik-accent-yellow)] text-sm">🪙 {child.points_balance}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PanelCard>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
              activeTab === "rewards"
                ? "bg-[var(--ik-accent-yellow)] text-[var(--ik-bg-dark)]"
                : "bg-[var(--ik-surface-1)] text-white hover:bg-[var(--ik-surface-2)]"
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Rewards
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-colors relative ${
              activeTab === "claims"
                ? "bg-[var(--ik-accent-cyan)] text-[var(--ik-bg-dark)]"
                : "bg-[var(--ik-surface-1)] text-white hover:bg-[var(--ik-surface-2)]"
            }`}
            aria-label={claims.length > 0 ? `Claims, ${claims.length} pending` : "Claims"}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Claims
            {claims.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--ik-accent-yellow)] text-[var(--ik-bg-dark)] rounded-full text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none"
                aria-hidden="true"
              >
                {claims.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {selectedChildId && (
          <>
            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <PanelCard className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Rewards for {selectedChild?.name}</h2>
                  <PrimaryButton onClick={() => { setShowCreateModal(true); setFormName(""); setFormCost("50"); }} icon={<Plus className="w-4 h-4" />}>
                    New
                  </PrimaryButton>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
                    <span className="text-[var(--ik-text-muted)]">Loading...</span>
                  </div>
                ) : availableRewards.length === 0 && approvedRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-10 h-10 text-[var(--ik-text-muted)] mx-auto mb-2 opacity-50" />
                    <p className="text-[var(--ik-text-muted)]">No rewards yet</p>
                    <p className="text-[var(--ik-text-muted)] text-xs mt-1">Create one with the + New button</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Available */}
                    {availableRewards.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[var(--ik-accent-cyan)] text-xs font-bold">Available ({availableRewards.length})</p>
                        {availableRewards.map((reward) => (
                          <RewardRow
                            key={reward.id}
                            reward={reward}
                            onEdit={() => openEditModal(reward)}
                            onDelete={() => handleDelete(reward)}
                            isLoading={actionRewardId === reward.id}
                          />
                        ))}
                      </div>
                    )}
                    {/* Claimed */}
                    {approvedRewards.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-green-400 text-xs font-bold">Claimed ({approvedRewards.length})</p>
                        {approvedRewards.map((reward) => (
                          <RewardRow key={reward.id} reward={reward} isLoading={false} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </PanelCard>
            )}

            {/* Claims Tab */}
            {activeTab === "claims" && (
              <PanelCard className="space-y-4">
                <h2 className="text-lg font-bold text-white">Pending Claims</h2>

                {claims.length === 0 ? (
                  <div className="text-center py-8">
                    <Check className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-[var(--ik-text-muted)]">No pending claims</p>
                    <p className="text-[var(--ik-text-muted)] text-xs mt-1">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <ClaimRow
                        key={claim.id}
                        claim={claim}
                        childPoints={ggpoints}
                        onApprove={() => handleApprove(claim)}
                        onReject={() => handleReject(claim)}
                        isLoading={actionRewardId === claim.id}
                      />
                    ))}
                  </div>
                )}
              </PanelCard>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Reward"
      >
          <div className="space-y-4">
            <TextInput
              label="Reward Name"
              placeholder="e.g., 30 min Screen Time"
              value={formName}
              onChange={setFormName}
            />
            <TextInput
              label="Cost (GGPoints)"
              placeholder="50"
              value={formCost}
              onChange={setFormCost}
            />
            <div className="flex gap-3">
              <SecondaryButton onClick={() => setShowCreateModal(false)} fullWidth>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleCreate} fullWidth disabled={!formName.trim() || actionRewardId === "create"} loading={actionRewardId === "create"}>
                Create
              </PrimaryButton>
            </div>
          </div>
      </Modal>

      {/* Edit Modal */}
      {editingReward && (
        <Modal
          isOpen={true}
          onClose={() => setEditingReward(null)}
          title="Edit Reward"
        >
          <div className="space-y-4">
            <TextInput
              label="Reward Name"
              placeholder="e.g., 30 min Screen Time"
              value={formName}
              onChange={setFormName}
            />
            <TextInput
              label="Cost (GGPoints)"
              placeholder="50"
              value={formCost}
              onChange={setFormCost}
              disabled={editingReward.status !== "available"}
            />
            {editingReward.status !== "available" && (
              <p className="text-[var(--ik-text-muted)] text-xs">Cost cannot be changed when reward is {editingReward.status}</p>
            )}
            <div className="flex gap-3">
              <SecondaryButton onClick={() => setEditingReward(null)} fullWidth>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleUpdate} fullWidth disabled={!formName.trim() || actionRewardId === editingReward.id} loading={actionRewardId === editingReward.id}>
                Save
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// === Sub-components ===

function RewardRow({ reward, onEdit, onDelete, isLoading }: {
  reward: RewardFromAPI;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading: boolean;
}) {
  const statusColors: Record<string, string> = {
    available: "bg-[var(--ik-accent-cyan)]/20 text-[var(--ik-accent-cyan)]",
    requested: "bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)]",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  const canEdit = reward.status === "available" || reward.status === "rejected";

  return (
    <div className="bg-[var(--ik-surface-1)] border border-[var(--ik-outline-light)] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">{reward.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[var(--ik-accent-yellow)] text-xs font-bold">🪙 {reward.cost} GG</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[reward.status]}`}>
              {reward.status}
            </span>
          </div>
        </div>
        {canEdit && onEdit && onDelete && (
          <div className="flex items-center gap-2">
            <button onClick={onEdit} disabled={isLoading} className="p-2 text-[var(--ik-accent-cyan)] hover:bg-[var(--ik-surface-2)] rounded-lg transition-colors disabled:opacity-50">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} disabled={isLoading} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
              {isLoading ? <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimRow({ claim, childPoints, onApprove, onReject, isLoading }: {
  claim: RewardFromAPI;
  childPoints: number;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}) {
  const canAfford = childPoints >= claim.cost;

  return (
    <div className="bg-[var(--ik-surface-1)] border-2 border-[var(--ik-accent-yellow)]/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">{claim.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[var(--ik-accent-yellow)] text-xs font-bold">🪙 {claim.cost} GG</span>
            {!canAfford && (
              <span className="text-red-400 text-xs">Not enough points</span>
            )}
          </div>
          {claim.requested_at && (
            <p className="text-[var(--ik-text-muted)] text-xs mt-1">
              Requested {new Date(claim.requested_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReject}
            disabled={isLoading}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Reject"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading || !canAfford}
            className="ik-btn-primary flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-[var(--ik-bg-dark)] border-t-transparent rounded-full" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
