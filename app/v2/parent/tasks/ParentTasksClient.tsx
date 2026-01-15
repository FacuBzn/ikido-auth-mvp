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
import {
  ArrowLeft,
  LogOut,
  CheckSquare,
  Plus,
  RefreshCw,
  ChevronDown,
  User,
  CheckCircle2,
  Clock,
  Award,
  Trash2,
} from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";
import type { ChildForSelector } from "./page";

/**
 * Task template type
 */
type TaskTemplate = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  is_global: boolean;
};

/**
 * Assigned task type
 */
type AssignedTask = {
  id: string;
  task_id: string;
  child_id: string;
  status: "pending" | "completed" | "approved" | "rejected";
  points: number;
  assigned_at: string;
  completed_at: string | null;
  title?: string;
  description?: string | null;
};

interface ParentTasksClientProps {
  parentId: string;
  childrenList: ChildForSelector[];
  initialChildId?: string;
}

/**
 * V2 Parent Tasks Client
 * Manages task templates and assignments
 */
export function ParentTasksClient({
  childrenList,
  initialChildId,
}: ParentTasksClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logout = useSessionStore((state) => state.logout);

  // Child selector state
  const [selectedChildId, setSelectedChildId] = useState<string>(
    initialChildId || ""
  );
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // Data states
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);

  // Loading states
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Custom task form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customPoints, setCustomPoints] = useState("10");

  // Success feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync URL with selected child
  useEffect(() => {
    const urlChildId = searchParams.get("childId");
    if (urlChildId && urlChildId !== selectedChildId) {
      setSelectedChildId(urlChildId);
    }
  }, [searchParams, selectedChildId]);

  const handleLogout = async () => {
    await logout();
    router.push("/v2/parent/login");
    router.refresh();
  };

  // Fetch task templates
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (selectedChildId) {
        params.append("childId", selectedChildId);
      }

      const response = await fetch(`/api/parent/tasks/list?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load task templates");
      }

      const data = await response.json();
      setTaskTemplates(data.tasks || []);
    } catch (err) {
      console.error("[V2 ParentTasks] Failed to load templates:", err);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [selectedChildId]);

  // Fetch assigned tasks for selected child
  const fetchAssignedTasks = useCallback(async () => {
    if (!selectedChildId) {
      setAssignedTasks([]);
      return;
    }

    setIsLoadingAssigned(true);
    try {
      const response = await fetch(
        `/api/parent/child-tasks/list?child_id=${encodeURIComponent(selectedChildId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load assigned tasks");
      }

      const data = await response.json();
      setAssignedTasks(data.data || []);
    } catch (err) {
      console.error("[V2 ParentTasks] Failed to load assigned tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoadingAssigned(false);
    }
  }, [selectedChildId]);

  // Load data when child changes
  useEffect(() => {
    void fetchTemplates();
    void fetchAssignedTasks();
  }, [fetchTemplates, fetchAssignedTasks]);

  // Handle child selection
  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    setShowChildDropdown(false);
    setError(null);
    // Update URL
    router.push(`/v2/parent/tasks?childId=${childId}`);
  };

  // Handle assign task
  const handleAssignTask = async (taskId: string) => {
    if (!selectedChildId) {
      setError("Please select a child first");
      return;
    }

    setAssigningTaskId(taskId);
    setError(null);

    try {
      const response = await fetch("/api/parent/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          child_user_id: selectedChildId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign task");
      }

      setSuccessMessage("Task assigned!");
      setTimeout(() => setSuccessMessage(null), 2000);

      // Refetch assigned tasks
      await fetchAssignedTasks();
    } catch (err) {
      console.error("[V2 ParentTasks] Failed to assign:", err);
      setError(err instanceof Error ? err.message : "Failed to assign task");
    } finally {
      setAssigningTaskId(null);
    }
  };

  // Handle create custom task
  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      setError("Please select a child first");
      return;
    }

    if (!customTitle.trim()) {
      setError("Task title is required");
      return;
    }

    const points = parseInt(customPoints, 10);
    if (isNaN(points) || points < 1 || points > 100) {
      setError("Points must be between 1 and 100");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/parent/tasks/custom-create-and-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          title: customTitle.trim(),
          points: points,
          description: customDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create task");
      }

      // Success - clear form
      setCustomTitle("");
      setCustomDescription("");
      setCustomPoints("10");
      setShowCustomForm(false);

      setSuccessMessage("Task created & assigned!");
      setTimeout(() => setSuccessMessage(null), 2000);

      // Refetch both lists
      await Promise.all([fetchAssignedTasks(), fetchTemplates()]);
    } catch (err) {
      console.error("[V2 ParentTasks] Failed to create custom task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle approve task
  const handleApproveTask = async (task: AssignedTask) => {
    setApprovingTaskId(task.id);
    setError(null);

    try {
      const response = await fetch("/api/parent/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_task_id: task.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve task");
      }

      // Show success feedback with points earned
      const pointsEarned = data.points_earned ?? task.points;
      setSuccessMessage(`Approved! +${pointsEarned} GGPoints granted`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refetch to update list
      await fetchAssignedTasks();
    } catch (err) {
      console.error("[V2 ParentTasks] Approve failed:", err);
      setError(err instanceof Error ? err.message : "Failed to approve task");
    } finally {
      setApprovingTaskId(null);
    }
  };

  // Handle delete assigned task
  const handleDeleteAssignment = async (taskId: string) => {
    if (!confirm("Remove this task assignment?")) return;

    setDeletingTaskId(taskId);
    setError(null);

    try {
      const response = await fetch("/api/parent/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          childId: selectedChildId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete");
      }

      // Remove from local state
      setAssignedTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSuccessMessage("Task removed");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error("[V2 ParentTasks] Failed to delete:", err);
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Get selected child info
  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  // Separate tasks by status
  const pendingTasks = assignedTasks.filter((t) => t.status === "pending");
  const awaitingApprovalTasks = assignedTasks.filter((t) => t.status === "completed");
  const approvedTasks = assignedTasks.filter((t) => t.status === "approved");

  // Check if template is already assigned
  const isTemplateAssigned = (templateId: string) =>
    assignedTasks.some((t) => t.task_id === templateId);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            <Award className="w-3 h-3" /> Approved
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--ik-accent-cyan)]/20 text-[var(--ik-accent-cyan)]">
            <Clock className="w-3 h-3" /> Awaiting Approval
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--ik-accent-yellow)]/20 text-[var(--ik-accent-yellow)]">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/v2/parent/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-[var(--ik-accent-yellow)]" />
            <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">
              Manage Tasks
            </h1>
          </div>
          <SecondaryButton
            onClick={() => {
              void fetchTemplates();
              void fetchAssignedTasks();
            }}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={isLoadingTemplates || isLoadingAssigned}
          >
            Refresh
          </SecondaryButton>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3 text-green-400 font-bold text-sm text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] rounded-xl p-3 text-white text-sm">
            <span className="font-bold">Error: </span>
            {error}
          </div>
        )}

        {/* No Children State */}
        {childrenList.length === 0 ? (
          <PanelCard className="text-center py-8">
            <User className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--ik-text-muted)] mb-4">
              No children added yet
            </p>
            <Link href="/v2/parent/dashboard">
              <PrimaryButton>Add Child</PrimaryButton>
            </Link>
          </PanelCard>
        ) : (
          <>
            {/* Child Selector */}
            <PanelCard>
              <div className="space-y-2">
                <p className="text-[var(--ik-text-muted)] text-xs">
                  Select Child
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowChildDropdown(!showChildDropdown)}
                    className="w-full bg-[var(--ik-surface-1)] border-2 border-[var(--ik-accent-yellow)]/50 rounded-xl p-4 flex items-center justify-between hover:border-[var(--ik-accent-yellow)] transition-colors"
                  >
                    <span className="text-white font-bold">
                      {selectedChild?.name || "Choose a child..."}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[var(--ik-accent-yellow)] transition-transform ${
                        showChildDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showChildDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {childrenList.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleSelectChild(child.id)}
                          className={`w-full p-4 text-left hover:bg-[var(--ik-surface-2)] transition-colors flex items-center justify-between ${
                            child.id === selectedChildId
                              ? "bg-[var(--ik-accent-yellow)]/10"
                              : ""
                          }`}
                        >
                          <div>
                            <p className="text-white font-bold">{child.name}</p>
                            {child.child_code && (
                              <p className="text-[var(--ik-text-muted)] text-xs">
                                {child.child_code}
                              </p>
                            )}
                          </div>
                          {child.id === selectedChildId && (
                            <CheckCircle2 className="w-5 h-5 text-[var(--ik-accent-yellow)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PanelCard>

            {/* Show content only when child selected */}
            {selectedChildId ? (
              <>
                {/* Assigned Tasks Section */}
                <PanelCard className="space-y-4">
                  <h2 className="text-lg font-bold text-white">
                    Tasks for {selectedChild?.name}
                  </h2>

                  {isLoadingAssigned ? (
                    <div className="flex items-center justify-center gap-3 py-6">
                      <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
                      <span className="text-[var(--ik-text-muted)]">
                        Loading tasks...
                      </span>
                    </div>
                  ) : assignedTasks.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckSquare className="w-10 h-10 text-[var(--ik-text-muted)] mx-auto mb-2 opacity-50" />
                      <p className="text-[var(--ik-text-muted)]">
                        No tasks assigned yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Pending */}
                      {pendingTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[var(--ik-accent-yellow)] text-xs font-bold">
                            Pending ({pendingTasks.length})
                          </p>
                          {pendingTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              statusBadge={getStatusBadge(task.status)}
                              onDelete={() => handleDeleteAssignment(task.id)}
                              isDeleting={deletingTaskId === task.id}
                            />
                          ))}
                        </div>
                      )}

                      {/* Awaiting Approval */}
                      {awaitingApprovalTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[var(--ik-accent-cyan)] text-xs font-bold">
                            ⏳ Awaiting Approval ({awaitingApprovalTasks.length})
                          </p>
                          {awaitingApprovalTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              statusBadge={getStatusBadge(task.status)}
                              onDelete={() => handleDeleteAssignment(task.id)}
                              isDeleting={deletingTaskId === task.id}
                              showApprove
                              onApprove={() => handleApproveTask(task)}
                              isApproving={approvingTaskId === task.id}
                            />
                          ))}
                        </div>
                      )}

                      {/* Approved */}
                      {approvedTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-green-400 text-xs font-bold">
                            ✓ Approved ({approvedTasks.length})
                          </p>
                          {approvedTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              statusBadge={getStatusBadge(task.status)}
                              onDelete={() => handleDeleteAssignment(task.id)}
                              isDeleting={deletingTaskId === task.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </PanelCard>

                {/* Available Tasks to Assign */}
                <PanelCard className="space-y-4">
                  <h2 className="text-lg font-bold text-white">
                    Assign Task
                  </h2>

                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center gap-3 py-6">
                      <div className="animate-spin w-5 h-5 border-2 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full" />
                      <span className="text-[var(--ik-text-muted)]">
                        Loading available tasks...
                      </span>
                    </div>
                  ) : taskTemplates.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[var(--ik-text-muted)]">
                        No task templates available
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {taskTemplates.map((template) => {
                        const isAssigned = isTemplateAssigned(template.id);
                        const isAssigning = assigningTaskId === template.id;

                        return (
                          <div
                            key={template.id}
                            className={`bg-[var(--ik-surface-1)] border-2 rounded-xl p-4 ${
                              isAssigned
                                ? "border-green-500/30 opacity-60"
                                : "border-[var(--ik-outline-light)]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white">
                                  {template.title}
                                </p>
                                {template.description && (
                                  <p className="text-[var(--ik-text-muted)] text-xs mt-1 line-clamp-2">
                                    {template.description}
                                  </p>
                                )}
                                <p className="text-[var(--ik-accent-yellow)] text-sm font-bold mt-2">
                                  🪙 {template.points} GG
                                </p>
                              </div>
                              <PrimaryButton
                                onClick={() => handleAssignTask(template.id)}
                                disabled={isAssigned || isAssigning}
                                loading={isAssigning}
                                className="shrink-0"
                              >
                                {isAssigned ? "Assigned" : "Assign"}
                              </PrimaryButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </PanelCard>

                {/* Create Custom Task */}
                <PanelCard className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      Create Custom Task
                    </h2>
                    {!showCustomForm && (
                      <SecondaryButton
                        onClick={() => setShowCustomForm(true)}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        New Task
                      </SecondaryButton>
                    )}
                  </div>

                  {showCustomForm && (
                    <form onSubmit={handleCreateCustomTask} className="space-y-4">
                      <TextInput
                        label="Task Title"
                        placeholder="e.g., Clean your room"
                        value={customTitle}
                        onChange={setCustomTitle}
                        disabled={isCreating}
                      />
                      <TextInput
                        label="Description (optional)"
                        placeholder="Additional details..."
                        value={customDescription}
                        onChange={setCustomDescription}
                        disabled={isCreating}
                      />
                      <TextInput
                        label="GGPoints (1-100)"
                        placeholder="10"
                        value={customPoints}
                        onChange={setCustomPoints}
                        disabled={isCreating}
                      />
                      <div className="flex gap-3">
                        <PrimaryButton
                          type="submit"
                          disabled={isCreating || !customTitle.trim()}
                          loading={isCreating}
                          fullWidth
                        >
                          Create & Assign
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => {
                            setShowCustomForm(false);
                            setCustomTitle("");
                            setCustomDescription("");
                            setCustomPoints("10");
                          }}
                        >
                          Cancel
                        </SecondaryButton>
                      </div>
                    </form>
                  )}
                </PanelCard>
              </>
            ) : (
              <PanelCard className="text-center py-8">
                <p className="text-[var(--ik-text-muted)]">
                  Select a child to manage their tasks
                </p>
              </PanelCard>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// Task Row Component
interface TaskRowProps {
  task: AssignedTask;
  statusBadge: React.ReactNode;
  onDelete: () => void;
  isDeleting: boolean;
  showApprove?: boolean;
  onApprove?: () => void;
  isApproving?: boolean;
}

function TaskRow({
  task,
  statusBadge,
  onDelete,
  isDeleting,
  showApprove = false,
  onApprove,
  isApproving = false,
}: TaskRowProps) {
  return (
    <div
      className={`bg-[var(--ik-surface-1)] border rounded-xl p-4 ${
        showApprove
          ? "border-[var(--ik-accent-cyan)]/50 border-2"
          : "border-[var(--ik-outline-light)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">{task.title || "Task"}</p>
          {task.description && (
            <p className="text-[var(--ik-text-muted)] text-xs mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[var(--ik-accent-yellow)] text-xs font-bold">
              🪙 {task.points} GG
            </span>
            {statusBadge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Approve Button */}
          {showApprove && onApprove && (
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="ik-btn-primary flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-[var(--ik-bg-dark)] border-t-transparent rounded-full" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Approve</span>
                </>
              )}
            </button>
          )}
          {/* Delete Button */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
