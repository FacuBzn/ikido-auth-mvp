"use client";

import { useMemo, useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Edit2, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type ChildUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "child_code"
>;

type ChildTask = Database["public"]["Tables"]["child_tasks"]["Row"];
type TaskTemplate = Database["public"]["Tables"]["tasks"]["Row"];

type TasksManagementProps = {
  parentId: string;
  initialChildren: ChildUser[];
};

type TaskDisplayProps = {
  task: ChildTask;
  onEdit: () => void;
  onDelete: () => void;
  supabase: SupabaseClient<Database>;
};

const TaskDisplay = ({ task, onEdit, onDelete, supabase }: TaskDisplayProps) => {
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTaskTemplate = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("title, description")
        .eq("id", task.task_id)
        .maybeSingle();
      
      if (data) {
        setTaskTitle(data.title);
        setTaskDescription(data.description);
      }
      setLoading(false);
    };

    void loadTaskTemplate();
  }, [task.task_id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm text-white/70">Loading...</span>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    in_progress: "text-blue-400",
    completed: "text-green-400",
    approved: "text-green-500",
    rejected: "text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: "○ Pending",
    in_progress: "⏳ In Progress",
    completed: "✓ Completed",
    approved: "✓ Approved",
    rejected: "✗ Rejected",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-base font-semibold">{taskTitle}</p>
        {taskDescription && (
          <p className="mt-1 text-sm text-white/70">{taskDescription}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
          <span>
            <span className="font-semibold text-[var(--brand-gold-400)]">
              {task.points}
            </span>{" "}
            GGPoints
          </span>
          <span className={statusColors[task.status] || "text-yellow-400"}>
            {statusLabels[task.status] || "○ Pending"}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {task.status !== "approved" && task.status !== "rejected" && (
          <Button
            onClick={onEdit}
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Edit2 className="size-4" />
          </Button>
        )}
        <Button
          onClick={onDelete}
          variant="ghost"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export const TasksManagement = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentId: _parentId,
  initialChildren,
}: TasksManagementProps) => {
  const supabase = useMemo(() => createBrowserClient(), []);
  const { toast } = useToast();

  const [children] = useState<ChildUser[]>(initialChildren);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [tasks, setTasks] = useState<ChildTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Global tasks state
  const [globalTasks, setGlobalTasks] = useState<TaskTemplate[]>([]);
  const [loadingGlobalTasks, setLoadingGlobalTasks] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPoints, setTaskPoints] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState(10);

  // Load global tasks on mount
  useEffect(() => {
    const loadGlobalTasks = async () => {
      setLoadingGlobalTasks(true);
      try {
        const response = await fetch("/api/parent/tasks/list");
        if (!response.ok) {
          throw new Error("Failed to load global tasks");
        }
        const data = await response.json();
        setGlobalTasks(data || []);
      } catch (cause) {
        console.error("[tasks:loadGlobal] Error:", cause);
        toast({
          variant: "destructive",
          title: "Error loading global tasks",
          description: "Could not load available tasks.",
        });
      } finally {
        setLoadingGlobalTasks(false);
      }
    };

    void loadGlobalTasks();
  }, [toast]);

  // Load assigned tasks when child is selected
  useEffect(() => {
    if (!selectedChildId) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("child_tasks")
          .select("*")
          .eq("child_user_id", selectedChildId)
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setTasks((data ?? []) as ChildTask[]);
      } catch (cause) {
        console.error("[tasks:load] Error loading tasks:", cause);
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: "Could not load tasks. Please try again.",
        });
      } finally {
        setLoadingTasks(false);
      }
    };

    void loadTasks();
  }, [selectedChildId, supabase, toast]);

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChildId) {
      setError("Please select a child first.");
      return;
    }

    if (!taskTitle.trim()) {
      setError("Task title is required.");
      return;
    }

    if (taskPoints < 1) {
      setError("Points must be at least 1.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First create a custom task template
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        throw new Error("Not authenticated");
      }

      // Get parent id
      const { data: parentData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authData.user.id)
        .eq("role", "parent")
        .maybeSingle();

      if (!parentData) {
        throw new Error("Parent not found");
      }

      // Create task template
      const { data: taskTemplate, error: templateError } = await supabase
        .from("tasks")
        .insert({
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          points: taskPoints,
          is_global: false,
        } as any)
        .select()
        .maybeSingle();

      if (templateError || !taskTemplate) {
        throw templateError || new Error("Failed to create task template");
      }

      // Assign task to selected child using API
      const assignResponse = await fetch("/api/parent/tasks/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: taskTemplate.id,
          child_user_id: selectedChildId,
        }),
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.message || "Failed to assign task");
      }

      const assignedTasks = await assignResponse.json();
      const childTask = assignedTasks?.[0];

      if (!childTask) {
        throw new Error("Task was not assigned successfully.");
      }

      const newTask = childTask as ChildTask;
      setTasks((prev) => [newTask, ...prev]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPoints(10);

      toast({
        title: "Task created",
        description: `Task "${taskTitle.trim()}" has been created and assigned.`,
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Could not create task. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = async (task: ChildTask) => {
    // Load task template to get title and description
    const { data: taskTemplate } = await supabase
      .from("tasks")
      .select("title, description, points")
      .eq("id", task.task_id)
      .maybeSingle();

    setEditingTaskId(task.id);
    setEditTitle(taskTemplate?.title || "");
    setEditDescription(taskTemplate?.description || "");
    setEditPoints(task.points);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPoints(10);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editTitle.trim()) {
      setError("Task title is required.");
      return;
    }

    if (editPoints < 1) {
      setError("Points must be at least 1.");
      return;
    }

    try {
      // Find the child task to get task_id
      const currentTask = tasks.find((t) => t.id === taskId);
      if (!currentTask) {
        throw new Error("Task not found");
      }

      // Update task template
      const { error: templateError } = await supabase
        .from("tasks")
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          points
: editPoints,
        })
        .eq("id", currentTask.task_id);

      if (templateError) {
        throw templateError;
      }

      // Update child_task points
      const { data, error: updateError } = await supabase
        .from("child_tasks")
        .update({
          points: editPoints,
        })
        .eq("id", taskId)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error("Task was not updated successfully.");
      }

      const updatedTask = data as ChildTask;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );
      setEditingTaskId(null);

      toast({
        title: "Task updated",
        description: `Task "${editTitle.trim()}" has been updated.`,
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Could not update task. Please try again.";
      setError(message);
    }
  };

  const handleAssignGlobalTask = async (taskId: string) => {
    if (!selectedChildId) {
      setError("Please select a child first.");
      return;
    }

    setAssigningTaskId(taskId);
    setError(null);

    try {
      const response = await fetch("/api/parent/tasks/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: taskId,
          child_user_id: selectedChildId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign task");
      }

      // Reload assigned tasks
      const { data, error: fetchError } = await supabase
        .from("child_tasks")
        .select("*")
        .eq("child_user_id", selectedChildId)
        .order("created_at", { ascending: false });

      if (!fetchError && data) {
        setTasks((data ?? []) as ChildTask[]);
      }

      toast({
        title: "Task assigned",
        description: "The task has been assigned to your child.",
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Could not assign task. Please try again.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task assignment?")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("child_tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      toast({
        title: "Task assignment deleted",
        description: "The task assignment has been removed.",
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Could not delete task. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <main className="screen-shell text-white">
      <div className="screen-card w-full max-w-2xl space-y-8 px-8 py-10">
        <Button
          variant="ghost"
          asChild
          className="w-fit self-start rounded-full bg-[#0d3a5c]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.6)] backdrop-blur"
        >
          <Link href="/parent/dashboard">← Back</Link>
        </Button>

        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Manage Tasks</h1>
          <p className="text-sm text-white/75">
            Create and manage tasks for your children. Each task can earn GGPoints when completed.
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className="border-red-400/40 bg-red-500/20 text-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="space-y-4 rounded-3xl bg-[#0d3a5c]/80 p-6">
          <div className="space-y-2">
            <Label className="ikido-section-title text-[var(--brand-gold-200)]">
              Select Child
            </Label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white">
                <SelectValue placeholder="Choose a child..." />
              </SelectTrigger>
              <SelectContent>
                {children.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No children available
                  </SelectItem>
                ) : (
                  children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} {child.child_code && `(${child.child_code})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedChildId && (
            <>
              {/* Global Tasks Section */}
              <div className="space-y-4">
                <Label className="ikido-section-title text-[var(--brand-gold-200)] text-lg">
                  Assign Global Tasks
                </Label>
                {loadingGlobalTasks ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-white/70">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading available tasks...</span>
                  </div>
                ) : globalTasks.length === 0 ? (
                  <div className="rounded-2xl bg-[#0b2f4c]/50 border border-white/10 p-6 text-center">
                    <p className="text-white/60">No global tasks available.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {globalTasks.map((globalTask) => {
                      const isAlreadyAssigned = tasks.some(
                        (t) => t.task_id === globalTask.id
                      );
                      const isAssigning = assigningTaskId === globalTask.id;

                      return (
                        <div
                          key={globalTask.id}
                          className="rounded-2xl border-2 border-[var(--brand-gold-400)]/40 bg-[#0b2f4c] p-5 hover:border-[var(--brand-gold-400)]/60 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="text-lg font-bold text-white">
                                {globalTask.title}
                              </h3>
                              {globalTask.description && (
                                <p className="text-sm text-white/80 leading-relaxed">
                                  {globalTask.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-base font-bold text-[var(--brand-gold-400)]">
                                  {globalTask.points}
                                </span>
                                <span className="text-sm text-[var(--brand-gold-400)]/80">
                                  GGPoints
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAssignGlobalTask(globalTask.id)}
                              disabled={isAlreadyAssigned || isAssigning}
                              className={`ikido-button ikido-button--gold ikido-button--pill text-sm font-semibold px-6 py-3 min-w-[100px] ${
                                isAlreadyAssigned
                                  ? "bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/20 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {isAssigning ? (
                                <>
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : isAlreadyAssigned ? (
                                <>
                                  <Check className="mr-2 size-4" />
                                  Assigned
                                </>
                              ) : (
                                "Assign"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <Label className="ikido-section-title text-[var(--brand-gold-200)] mb-4 block">
                  Or Create Custom Task
                </Label>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="task-title"
                  className="ikido-section-title text-[var(--brand-gold-200)]"
                >
                  Task Title
                </Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Tidy your room"
                  required
                  className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="task-description"
                  className="ikido-section-title text-[var(--brand-gold-200)]"
                >
                  Description (optional)
                </Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Additional details about the task..."
                  rows={3}
                  className="rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white placeholder:text-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="task-points"
                  className="ikido-section-title text-[var(--brand-gold-200)]"
                >
                  GGPoints
                </Label>
                <Input
                  id="task-points"
                  type="number"
                  min="1"
                  value={taskPoints}
                  onChange={(e) => setTaskPoints(Number.parseInt(e.target.value) || 0)}
                  required
                  className="h-12 rounded-3xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="ikido-button ikido-button--gold ikido-button--pill text-sm uppercase tracking-[0.25em]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Create Task
                  </>
                )}
              </Button>
            </form>
            </>
          )}
        </section>

        {selectedChildId && (
          <section className="space-y-4 rounded-3xl bg-[#0d3a5c]/80 p-6">
            <h2 className="text-lg font-semibold text-[var(--brand-gold-400)]">
              Tasks for {selectedChild?.name}
            </h2>

            {loadingTasks ? (
              <div className="flex items-center justify-center gap-3 py-8 text-white/70">
                <Loader2 className="size-5 animate-spin" />
                <span>Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <p className="rounded-3xl bg-[#0b2f4c] px-4 py-6 text-center text-white/70">
                No tasks yet. Create your first task above.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#0b2f4c] p-4"
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-10 rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white"
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={editPoints}
                            onChange={(e) => setEditPoints(Number.parseInt(e.target.value) || 0)}
                            className="h-10 w-24 rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#1a5fa0]/40 text-white"
                          />
                          <span className="text-sm text-white/70">GGPoints</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(task.id)}
                            className="ikido-button ikido-button--gold ikido-button--pill text-xs"
                          >
                            <Check className="mr-2 size-3" />
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="ghost"
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <TaskDisplay
                        task={task}
                        onEdit={() => void handleStartEdit(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        supabase={supabase}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

