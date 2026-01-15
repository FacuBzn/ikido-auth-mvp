"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  PrimaryButton,
  SecondaryButton,
  CyanButton,
  PointsPill,
} from "@/components/ikido";
import {
  LogOut,
  Gamepad2,
  CheckCircle2,
  ListTodo,
  Gift,
  RefreshCw,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Task type from API
 */
type TaskFromAPI = {
  child_task_id: string;
  task_id: string;
  title: string;
  description: string | null;
  points: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

/**
 * V2 Child Dashboard Client
 * Full dashboard with tasks, points, and complete task functionality
 * Uses same API endpoints as V1:
 * - POST /api/child/tasks (get tasks list + ggpoints)
 * - POST /api/child/points (get ggpoints)
 * - POST /api/child/tasks/complete (mark task complete)
 */
export function ChildDashboardClient() {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);
  const logout = useSessionStore((state) => state.logout);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  // Data states
  const [tasks, setTasks] = useState<TaskFromAPI[]>([]);
  const [ggpoints, setGgpoints] = useState<number>(0);

  // Loading states
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Error states
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Success feedback
  const [successTaskId, setSuccessTaskId] = useState<string | null>(null);
  const [successPoints, setSuccessPoints] = useState<number | null>(null);

  // Auth guard - redirect if no child session
  useEffect(() => {
    if (hasHydrated && !child) {
      router.replace("/v2/child/join");
    }
  }, [child, hasHydrated, router]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!child?.child_code || !child?.family_code) return;

    setIsLoadingTasks(true);
    setTasksError(null);

    try {
      const response = await fetch("/api/child/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to load tasks");
      }

      const data = await response.json();
      setTasks(data.tasks || []);

      // Update points from tasks endpoint
      if (data.ggpoints !== undefined) {
        setGgpoints(data.ggpoints);
      }
    } catch (error) {
      console.error("[V2 ChildDashboard] Failed to load tasks:", error);
      setTasksError(
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setIsLoadingTasks(false);
    }
  }, [child?.child_code, child?.family_code]);

  // Fetch points from API
  const fetchPoints = useCallback(async () => {
    if (!child?.child_code || !child?.family_code) return;

    setIsLoadingPoints(true);

    try {
      const response = await fetch("/api/child/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGgpoints(data.ggpoints || 0);
      }
    } catch (error) {
      console.error("[V2 ChildDashboard] Failed to load points:", error);
    } finally {
      setIsLoadingPoints(false);
    }
  }, [child?.child_code, child?.family_code]);

  // Load data when child is available
  useEffect(() => {
    if (hasHydrated && child) {
      void fetchTasks();
      void fetchPoints();
    }
  }, [hasHydrated, child, fetchTasks, fetchPoints]);

  // Handle task completion
  const handleCompleteTask = async (task: TaskFromAPI) => {
    if (!child?.child_code || !child?.family_code) return;

    const taskId = task.child_task_id;
    const taskPoints = task.points;

    setCompletingTaskId(taskId);
    setSuccessTaskId(null);
    setSuccessPoints(null);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.child_task_id === taskId
          ? { ...t, completed: true, completed_at: new Date().toISOString() }
          : t
      )
    );

    try {
      const response = await fetch("/api/child/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_task_id: taskId,
          child_code: child.child_code,
          family_code: child.family_code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete task");
      }

      // Show success feedback
      setSuccessTaskId(taskId);
      setSuccessPoints(taskPoints);

      // Clear success feedback after 3 seconds
      setTimeout(() => {
        setSuccessTaskId(null);
        setSuccessPoints(null);
      }, 3000);

      // Refetch to ensure data consistency
      await Promise.all([fetchTasks(), fetchPoints()]);
    } catch (error) {
      console.error("[V2 ChildDashboard] Failed to complete task:", error);

      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.child_task_id === taskId
            ? { ...t, completed: false, completed_at: null }
            : t
        )
      );

      // Show error in the task card
      setTasksError(
        error instanceof Error ? error.message : "Failed to complete task"
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/v2/child/join");
    router.refresh();
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

  // Separate pending and completed tasks
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Points Pill */}
        <PointsPill
          points={ggpoints}
          loading={isLoadingPoints}
        />

        {/* Logo */}
        <IkidoLogo />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>EXIT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Welcome Card */}
        <PanelCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
              </div>
              <div>
                <p className="text-[var(--ik-text-muted)] text-xs">Hello,</p>
                <h1 className="text-xl font-black text-[var(--ik-accent-yellow)]">
                  {child.name || "Player"}!
                </h1>
              </div>
            </div>

            {/* Points Display */}
            <div className="text-right">
              <p className="text-[var(--ik-text-muted)] text-xs">Your GGPoints</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[var(--ik-accent-yellow)]">
                  {isLoadingPoints ? "..." : ggpoints}
                </span>
                <span className="text-[var(--ik-accent-cyan)] text-xs font-bold">
                  🪙
                </span>
              </div>
            </div>
          </div>

          {/* Success Feedback */}
          {successPoints !== null && (
            <div className="mt-4 bg-green-500/20 border-2 border-green-500 rounded-xl p-3 flex items-center gap-3 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-green-400 font-bold text-sm">
                +{successPoints} GGPoints earned!
              </span>
            </div>
          )}
        </PanelCard>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link href="/v2/child/rewards" className="flex-1">
            <CyanButton fullWidth icon={<Gift className="w-4 h-4" />}>
              Rewards
            </CyanButton>
          </Link>
          <SecondaryButton
            onClick={() => {
              void fetchTasks();
              void fetchPoints();
            }}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={isLoadingTasks}
          >
            Refresh
          </SecondaryButton>
        </div>

        {/* Tasks Section */}
        <PanelCard className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
              <h2 className="text-lg font-bold text-white">Your Tasks</h2>
            </div>
            {tasks.length > 0 && (
              <span className="text-[var(--ik-text-muted)] text-sm">
                {pendingTasks.length} pending
              </span>
            )}
          </div>

          {/* Error State */}
          {tasksError && (
            <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white text-sm p-3 rounded-xl flex items-start gap-2">
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm text-white/80">{tasksError}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingTasks && tasks.length === 0 && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
              <span className="text-[var(--ik-text-muted)]">
                Loading tasks...
              </span>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingTasks && tasks.length === 0 && !tasksError && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-[var(--ik-text-muted)]">No tasks assigned yet</p>
              <p className="text-[var(--ik-text-muted)] text-sm mt-1">
                Your parent will assign tasks soon!
              </p>
            </div>
          )}

          {/* Tasks List */}
          {tasks.length > 0 && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* Pending Tasks First */}
              {pendingTasks.map((task) => (
                <TaskCard
                  key={task.child_task_id}
                  task={task}
                  isCompleting={completingTaskId === task.child_task_id}
                  isSuccess={successTaskId === task.child_task_id}
                  onComplete={() => handleCompleteTask(task)}
                />
              ))}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && pendingTasks.length > 0 && (
                <div className="border-t border-[var(--ik-outline-light)] my-4 pt-4">
                  <p className="text-[var(--ik-text-muted)] text-xs mb-3">
                    Completed ({completedTasks.length})
                  </p>
                </div>
              )}
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.child_task_id}
                  task={task}
                  isCompleting={false}
                  isSuccess={successTaskId === task.child_task_id}
                  onComplete={() => {}}
                />
              ))}
            </div>
          )}
        </PanelCard>

        {/* Link to V1 */}
        <div className="text-center">
          <Link
            href="/child/dashboard"
            className="text-[var(--ik-accent-cyan)] text-sm underline underline-offset-2 hover:text-[var(--ik-accent-cyan-dark)]"
          >
            Go to Current Dashboard (V1)
          </Link>
        </div>
      </div>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: TaskFromAPI;
  isCompleting: boolean;
  isSuccess: boolean;
  onComplete: () => void;
}

function TaskCard({ task, isCompleting, isSuccess, onComplete }: TaskCardProps) {
  return (
    <div
      className={`bg-[var(--ik-surface-1)] border-2 rounded-xl p-4 transition-all ${
        task.completed
          ? "border-green-500/30 opacity-75"
          : isSuccess
          ? "border-green-500 animate-pulse"
          : "border-[var(--ik-outline-light)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {task.completed && (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={`font-bold text-lg break-words ${
                  task.completed ? "text-white/70 line-through" : "text-white"
                }`}
              >
                {task.title || "Task"}
              </h3>
              {task.description && (
                <p className="text-[var(--ik-text-muted)] text-sm mt-1 break-words line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Task Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Points Chip */}
            <span className="inline-flex items-center gap-1 bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)] text-xs font-bold px-2.5 py-1 rounded-full">
              🪙 {task.points} GGPoints
            </span>

            {/* Status Chip */}
            <span
              className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                task.completed
                  ? "bg-green-500/20 text-green-400"
                  : "bg-[var(--ik-accent-cyan)]/20 text-[var(--ik-accent-cyan)]"
              }`}
            >
              {task.completed ? "✓ Completed" : "○ Pending"}
            </span>
          </div>
        </div>

        {/* Complete Button */}
        {!task.completed && (
          <PrimaryButton
            onClick={onComplete}
            disabled={isCompleting}
            loading={isCompleting}
            className="shrink-0"
          >
            {isCompleting ? "..." : "Complete"}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
