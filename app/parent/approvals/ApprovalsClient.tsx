"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ikido";
import { ArrowLeft, CheckCircle, Clock, RefreshCw, User } from "lucide-react";

type ChildForSelector = {
  id: string;
  name: string;
};

type PendingTask = {
  child_task_id: string;
  task_id: string;
  title: string;
  description: string | null;
  points: number;
  completed_at: string | null;
};

type ApprovalsClientProps = {
  childrenList: ChildForSelector[];
};

export function ApprovalsClient({ childrenList }: ApprovalsClientProps) {
  // State
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenList[0]?.id || ""
  );
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [childName, setChildName] = useState<string>("");
  const [ggpointsChild, setGgpointsChild] = useState<number>(0);

  // Loading states
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch pending tasks for selected child
  const fetchPendingTasks = useCallback(async () => {
    if (!selectedChildId) return;

    setIsLoadingTasks(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/parent/child-tasks/pending-approval?child_id=${encodeURIComponent(selectedChildId)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load pending tasks");
      }

      const data = await response.json();
      setPendingTasks(data.tasks || []);
      setChildName(data.child?.name || "Unknown");
      setGgpointsChild(data.ggpoints_child ?? 0);
    } catch (err) {
      console.error("[ApprovalsClient] Failed to fetch:", err);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedChildId]);

  // Load on mount and child change
  useEffect(() => {
    if (selectedChildId) {
      void fetchPendingTasks();
    }
  }, [selectedChildId, fetchPendingTasks]);

  // Handle approve
  const handleApprove = async (childTaskId: string, taskTitle: string, points: number) => {
    setApprovingTaskId(childTaskId);
    setError(null);

    try {
      const response = await fetch("/api/parent/child-tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_task_id: childTaskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve");
      }

      // Update local state
      setPendingTasks((prev) => prev.filter((t) => t.child_task_id !== childTaskId));

      // Update points from response
      if (data.ggpoints_child !== undefined) {
        setGgpointsChild(data.ggpoints_child);
      }

      // Show success
      const pointsEarned = data.points_earned ?? points;
      setSuccessMessage(`Approved "${taskTitle}" +${pointsEarned} GG`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("[ApprovalsClient] Approve failed:", err);
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApprovingTaskId(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // No children
  if (childrenList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/parent/dashboard"
            className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </Link>
          <IkidoLogo />
          <div className="w-20" />
        </div>

        <PanelCard className="text-center py-12">
          <User className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">No children yet</p>
          <Link
            href="/parent/dashboard"
            className="text-[var(--ik-accent-cyan)] text-sm underline mt-2 inline-block"
          >
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
        <Link
          href="/parent/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <SecondaryButton
          onClick={() => void fetchPendingTasks()}
          icon={<RefreshCw className="w-4 h-4" />}
          disabled={isLoadingTasks}
        >
          Refresh
        </SecondaryButton>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">
            Approve Tasks
          </h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
            <span className="text-green-400 font-bold">{successMessage}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] rounded-xl p-4">
            <p className="text-white/80 text-sm">{error}</p>
          </div>
        )}

        {/* Child Selector */}
        <PanelCard>
          <label className="block text-sm text-[var(--ik-text-muted)] mb-2">
            Select Child
          </label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-surface-2)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--ik-accent-cyan)]"
          >
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>

          {/* Child Points */}
          {selectedChildId && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[var(--ik-text-muted)] text-sm">
                {childName}&apos;s Balance:
              </span>
              <span className="text-[var(--ik-accent-yellow)] font-bold">
                🪙 {ggpointsChild} GG
              </span>
            </div>
          )}
        </PanelCard>

        {/* Pending Tasks */}
        <PanelCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
              Pending Approvals
            </h2>
            <span className="text-[var(--ik-text-muted)] text-sm">
              {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Loading */}
          {isLoadingTasks && pendingTasks.length === 0 && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
              <span className="text-[var(--ik-text-muted)]">Loading...</span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingTasks && pendingTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-[var(--ik-text-muted)]">All caught up!</p>
              <p className="text-[var(--ik-text-muted)] text-sm mt-1">
                No tasks waiting for approval.
              </p>
            </div>
          )}

          {/* Task List */}
          {pendingTasks.length > 0 && (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.child_task_id}
                  className="bg-[var(--ik-surface-1)] rounded-xl p-4 border-2 border-[var(--ik-surface-2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-[var(--ik-text-muted)] text-sm mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[var(--ik-accent-yellow)] text-sm font-bold">
                          +{task.points} GG
                        </span>
                        <span className="text-[var(--ik-text-muted)] text-xs">
                          Completed {formatDate(task.completed_at)}
                        </span>
                      </div>
                    </div>

                    <PrimaryButton
                      onClick={() =>
                        handleApprove(task.child_task_id, task.title, task.points)
                      }
                      disabled={approvingTaskId !== null}
                      loading={approvingTaskId === task.child_task_id}
                      className="shrink-0"
                    >
                      Approve
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
