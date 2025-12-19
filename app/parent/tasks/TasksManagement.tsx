"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";
import { BackButton } from "@/components/navigation/BackButton";
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

type TaskCardProps = {
  task: TaskTemplate;
  isAlreadyAssigned: boolean;
  isAssigning: boolean;
  onAssign: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
};

// TaskCard component for global tasks
const TaskCard = ({
  task,
  isAlreadyAssigned,
  isAssigning,
  onAssign,
  onDelete,
}: TaskCardProps) => {
  return (
    <div className="flex flex-col rounded-xl border-2 border-[var(--brand-gold-400)]/40 bg-[#0b2f4c] p-5 shadow-md transition-all hover:border-[var(--brand-gold-400)]/60 hover:shadow-lg">
      <div className="flex flex-1 flex-col gap-3 mb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-white flex-1">{task.title}</h3>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {task.description && (
          <p className="flex-1 text-sm text-white/70 leading-relaxed">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-yellow-400">
            {task.points} GGPoints
          </span>
        </div>
      </div>
      <div className="mt-auto pt-2 flex justify-end">
        <Button
          onClick={() => onAssign(task.id)}
          disabled={isAlreadyAssigned || isAssigning}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
            isAlreadyAssigned
              ? "bg-green-600/80 border-2 border-green-400 text-white hover:bg-green-600/80 cursor-not-allowed shadow-md"
              : "bg-yellow-400 text-blue-900 hover:bg-yellow-300"
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
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold break-words">{taskTitle}</p>
        {taskDescription && (
          <p className="mt-1 text-sm text-white/70 break-words">{taskDescription}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
          <span>
            <span className="font-semibold text-[var(--brand-gold-400)]">
              {task.points ?? 0}
            </span>{" "}
            GGPoints
          </span>
          <span className={statusColors[task.status] || "text-yellow-400"}>
            {statusLabels[task.status] || "○ Pending"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.status !== "approved" && task.status !== "rejected" && (
          <Button
            onClick={onEdit}
            variant="ghost"
            className="h-9 w-9 p-0 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold-400)]"
            aria-label="Edit task"
          >
            <Edit2 className="size-4" />
          </Button>
        )}
        <Button
          onClick={onDelete}
          variant="ghost"
          className="h-9 w-9 p-0 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label="Delete task"
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
  const [taskPoints, setTaskPoints] = useState<string>("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState<string>("10");

  // Load global tasks function (reusable with cache busting and pagination)
  const loadGlobalTasks = useCallback(async (options?: { cacheBust?: boolean; limit?: number; offset?: number; childId?: string }) => {
    setLoadingGlobalTasks(true);
    try {
      const limit = options?.limit ?? 5; // Default 5 items
      const offset = options?.offset ?? 0;
      const childId = options?.childId || selectedChildId || undefined;
      
      // Build URL with query params
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      
      if (childId) {
        params.append("childId", childId);
      }
      
      if (options?.cacheBust) {
        params.append("t", String(Date.now()));
      }
      
      const url = `/api/parent/tasks/list?${params.toString()}`;
      
      const response = await fetch(url, {
        cache: "no-store", // Always prevent caching
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load global tasks");
      }
      
      const result = await response.json();
      
      // Handle both old format (array) and new format ({ tasks, total })
      const tasks = result.tasks || result || [];
      const total = result.total ?? tasks.length;
      
      console.log("[tasks:loadGlobal] Tasks loaded", {
        count: tasks.length,
        total,
        limit,
        offset,
        childId: childId || "none",
        cacheBust: options?.cacheBust || false,
      });
      
      setGlobalTasks(tasks);
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
  }, [toast, selectedChildId]);

  // Load global tasks on mount
  useEffect(() => {
    void loadGlobalTasks();
  }, [loadGlobalTasks]);

  // Helper function for retry with exponential backoff
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries = 2,
    retryDelay = 1000
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Show retry toast
          toast({
            title: "Reintentando...",
            description: `Intento ${attempt + 1} de ${maxRetries + 1}`,
          });
          
          // Exponential backoff: 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          cache: "no-store",
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on abort (timeout) or 4xx errors
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timeout. Please try again.");
        }
        
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          throw lastError; // Don't retry client errors
        }
        
        // Continue to next retry
        if (attempt < maxRetries) {
          console.warn(`[tasks:fetchWithRetry] Attempt ${attempt + 1} failed, retrying...`, {
            error: lastError.message,
            url,
          });
        }
      }
    }
    
    throw lastError || new Error("Failed after retries");
  };

  // Load assigned tasks when child is selected (using internal API, no CORS)
  useEffect(() => {
    if (!selectedChildId) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        console.log("[tasks:load] Loading tasks for child", {
          child_id: selectedChildId,
          using_endpoint: "/api/parent/child-tasks/list",
        });
        
        const url = `/api/parent/child-tasks/list?child_id=${encodeURIComponent(selectedChildId)}`;
        const response = await fetchWithRetry(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.message || result.error);
        }

        const data = result.data || [];

        // Diagnostic: Log first item to verify points field
        if (data && data.length > 0 && process.env.NODE_ENV === "development") {
          console.log("[tasks:load] Sample task item:", {
            id: data[0].id,
            points: data[0].points,
            points_type: typeof data[0].points,
            task_id: data[0].task_id,
            status: data[0].status,
            full_item: data[0],
          });
        }

        console.log("[tasks:load] Tasks loaded successfully", {
          count: data?.length || 0,
          child_id: selectedChildId,
        });

        setTasks((data ?? []) as ChildTask[]);
      } catch (cause) {
        console.error("[tasks:load] Error loading tasks:", cause);
        
        const errorMessage = cause instanceof Error ? cause.message : String(cause);
        
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: errorMessage || "Could not load tasks. Please try again.",
        });
      } finally {
        setLoadingTasks(false);
      }
    };

    void loadTasks();
  }, [selectedChildId, toast]);

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

    // Clamp points to 1-100 before submitting
    const pointsValue = Number.parseInt(taskPoints, 10) || 0;
    const clampedPoints = Math.max(1, Math.min(100, pointsValue));
    
    if (clampedPoints < 1 || clampedPoints > 100) {
      setError("GGPoints must be between 1 and 100.");
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
          points: clampedPoints,
          is_global: false,
          created_by_parent_id: parentData.id,
        })
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

      // Reload tasks to ensure we have complete data including points
      const { data: reloadedData, error: reloadError } = await supabase
        .from("child_tasks")
        .select("*")
        .eq("child_id", selectedChildId)
        .order("assigned_at", { ascending: false });

      if (reloadError) {
        console.error("[tasks:create] Reload error after create:", reloadError);
        // Fallback: add new task even if reload fails
        const newTask = childTask as ChildTask;
        setTasks((prev) => [newTask, ...prev]);
      } else if (reloadedData) {
        // Diagnostic: Log first item to verify points after create
        if (reloadedData.length > 0 && process.env.NODE_ENV === "development") {
          console.log("[tasks:create] Sample reloaded task after create:", {
            id: reloadedData[0].id,
            points: reloadedData[0].points,
            points_type: typeof reloadedData[0].points,
          });
        }
        setTasks((reloadedData ?? []) as ChildTask[]);
      } else {
        // Fallback: add new task if reload returns no data
        const newTask = childTask as ChildTask;
        setTasks((prev) => [newTask, ...prev]);
      }
      
      setTaskTitle("");
      setTaskDescription("");
      setTaskPoints("10");

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
    setEditPoints(String(task.points ?? 10));
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPoints("10");
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editTitle.trim()) {
      setError("Task title is required.");
      return;
    }

    // Clamp points to 1-100 before submitting
    const pointsValue = Number.parseInt(editPoints, 10) || 0;
    const clampedPoints = Math.max(1, Math.min(100, pointsValue));
    
    if (clampedPoints < 1 || clampedPoints > 100) {
      setError("GGPoints must be between 1 and 100.");
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
          points: clampedPoints,
        })
        .eq("id", currentTask.task_id);

      if (templateError) {
        throw templateError;
      }

      // Update child_task points
      const { data, error: updateError } = await supabase
        .from("child_tasks")
        .update({
          points: clampedPoints,
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
      console.log("[tasks:assignGlobal] Reloading tasks for child", {
        child_id: selectedChildId,
        using_column: "child_id",
      });
      
      const { data, error: fetchError } = await supabase
        .from("child_tasks")
        .select("*")
        .eq("child_id", selectedChildId)
        .order("assigned_at", { ascending: false });

      if (fetchError) {
        console.error("[tasks:assignGlobal] Reload error:", {
          error: fetchError,
          errorCode: fetchError.code,
          errorMessage: fetchError.message,
        });
      } else if (data) {
        console.log("[tasks:assignGlobal] Tasks reloaded", {
          count: data.length,
          child_id: selectedChildId,
        });
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

  const handleDeleteGlobalTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to remove this task from your catalog?")) {
      return;
    }

    try {
      // Get auth context
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (!authData?.user || authError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Not authenticated",
        });
        return;
      }

      const parentAuthId = authData.user.id;

      // Find the task to check if it's global or custom
      const taskToDelete = globalTasks.find((t) => t.id === taskId);
      if (!taskToDelete) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Task not found",
        });
        return;
      }

      console.log("[tasks:deleteGlobal] Starting delete/hide", {
        taskId,
        isGlobal: taskToDelete.is_global,
        createdByParentId: taskToDelete.created_by_parent_id,
        currentCount: globalTasks.length,
      });

      // Validate child is selected
      if (!selectedChildId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a child first",
        });
        return;
      }

      // Optimistic update: Remove from UI immediately BEFORE API call
      setGlobalTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== taskId);
        console.log("[tasks:deleteGlobal] Optimistic update", {
          beforeCount: prev.length,
          afterCount: filtered.length,
          removedTaskId: taskId,
          childId: selectedChildId,
        });
        return filtered;
      });

      // Call API to handle delete/hide (with childId for global tasks)
      const response = await fetch("/api/parent/tasks/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, childId: selectedChildId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to delete/hide task";
        
        // Check if it's a timeout/network error (503) - don't revert immediately
        if (response.status === 503 || errorMessage.includes("timeout") || errorMessage.includes("Connection")) {
          console.warn("[tasks:deleteGlobal] Timeout/network error, re-validating before reverting", {
            taskId,
            error: errorData,
          });
          
          // Re-fetch to check if the delete actually succeeded on the backend
          await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });
          
          // If the task is still in the list, it means the delete failed - show error
          try {
            const checkParams = new URLSearchParams({
              limit: "5",
              childId: selectedChildId,
            });
            const checkResponse = await fetch(`/api/parent/tasks/list?${checkParams.toString()}`, { cache: "no-store" });
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const currentTasks = checkData.tasks || checkData || [];
              
              if (currentTasks.some((t: TaskTemplate) => t.id === taskId)) {
                // Task still exists, revert optimistic update
                await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });
                throw new Error("Problema de conexión. Por favor, reintentá.");
              } else {
                // Task was deleted, just refresh to ensure consistency
                await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });
                toast({
                  title: "Task ocultada",
                  description: "La task fue ocultada correctamente.",
                });
                return; // Success, exit early
              }
            }
          } catch (checkError) {
            // If check fails, revert and show error
            await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });
            throw new Error("Problema de conexión. Por favor, reintentá.");
          }
        } else {
          // Other errors - revert optimistic update
          console.error("[tasks:deleteGlobal] API error, reverting optimistic update", {
            taskId,
            error: errorData,
          });
          await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });
          throw new Error(errorMessage);
        }
      }

      // Re-fetch to ensure consistency and "refill" the window of 5 items
      console.log("[tasks:deleteGlobal] API success, re-fetching tasks to refill window", {
        taskId,
        childId: selectedChildId,
      });
      await loadGlobalTasks({ limit: 5, childId: selectedChildId, cacheBust: true });

      toast({
        title: taskToDelete.is_global ? "Task hidden" : "Task deleted",
        description: taskToDelete.is_global
          ? "The task has been hidden from your catalog."
          : "The task has been permanently deleted.",
      });
    } catch (cause) {
      console.error("[tasks:deleteGlobal] Delete/hide failed:", cause);
      const errorMessage = cause instanceof Error ? cause.message : String(cause);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage || "Could not delete/hide task. Please try again.",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task assignment?")) {
      return;
    }

    if (!selectedChildId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No child selected",
      });
      return;
    }

    // Find the task to get context for logging
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Task not found",
      });
      return;
    }

    try {
      // Get auth context for logging
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (!authData?.user || authError) {
        console.error("[tasks:delete] Auth check failed:", {
          hasUser: !!authData?.user,
          authError,
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: "Not authenticated",
        });
        return;
      }

      const parentAuthId = authData.user.id;

      // Verify session is valid for RLS
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[tasks:delete] Session check:", {
        hasSession: !!sessionData?.session,
        hasAccessToken: !!sessionData?.session?.access_token,
        userId: parentAuthId.substring(0, 8) + "...",
      });

      // Step 1: Determine what type of ID we're deleting
      const recordShape = Object.keys(taskToDelete);
      const isAssignedTask = recordShape.includes("child_id") && recordShape.includes("task_id");
      
      console.log("[tasks:delete] Starting delete - Context", {
        taskId,
        childId: selectedChildId,
        parentAuthId: `${parentAuthId.substring(0, 8)}...`,
        recordShape,
        isAssignedTask,
        taskData: {
          id: taskToDelete.id,
          task_id: taskToDelete.task_id,
          child_id: taskToDelete.child_id,
          parent_id: taskToDelete.parent_id,
          status: taskToDelete.status,
        },
      });

      // Step 2: Get parent internal id from auth_id (for RLS and verification)
      const { data: parentData, error: parentError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", parentAuthId)
        .eq("role", "parent")
        .single();

      if (parentError || !parentData) {
        console.error("[tasks:delete] Parent not found", {
          parentAuthId: `${parentAuthId.substring(0, 8)}...`,
          parentError,
        });
        throw new Error("Parent not found");
      }

      const parentInternalId = parentData.id;

      console.log("[tasks:delete] Delete with filters", {
        taskId,
        childId: selectedChildId,
        parentInternalId,
        taskParentId: taskToDelete.parent_id,
        taskChildId: taskToDelete.child_id,
        parentIdsMatch: taskToDelete.parent_id === parentInternalId,
        childIdsMatch: taskToDelete.child_id === selectedChildId,
      });

      // Step 3: Delete from child_tasks (this is an assignment, not a template)
      // The list shows "Tasks for [Child]" which are assignments from child_tasks
      // taskId is child_tasks.id (PK of the assignment)
      // 
      // IMPORTANT: If parent_id or child_id don't match, the delete will return 0 rows
      // This could happen if:
      // 1. RLS is blocking (but we'd get an error, not 0 rows)
      // 2. The filters don't match the actual data
      // 
      // Try delete with just PK first, then verify ownership
      const { data: deleteData, error: deleteError } = await supabase
        .from("child_tasks")
        .delete()
        .eq("id", taskId) // PK of child_tasks - this should be enough if RLS allows it
        .select();

      // If delete returned 0 rows, try to understand why
      if (!deleteError && (!deleteData || deleteData.length === 0)) {
        // Query the record to see what values it actually has
        const { data: recordData, error: recordError } = await supabase
          .from("child_tasks")
          .select("id, child_id, parent_id, task_id, status")
          .eq("id", taskId)
          .maybeSingle();

        console.error("[tasks:delete] Delete returned 0 rows - investigating:", {
          taskId,
          recordExists: !!recordData,
          recordData: recordData || null,
          recordError: recordError || null,
          expectedChildId: selectedChildId,
          expectedParentId: parentInternalId,
          actualChildId: recordData?.child_id,
          actualParentId: recordData?.parent_id,
          childIdMatches: recordData?.child_id === selectedChildId,
          parentIdMatches: recordData?.parent_id === parentInternalId,
        });

        // If record exists but filters didn't match, it's likely an RLS issue
        if (recordData) {
          throw new Error(
            `Delete returned 0 rows but record exists. ` +
            `This may be an RLS issue. ` +
            `Expected parent_id: ${parentInternalId}, actual: ${recordData.parent_id}. ` +
            `Expected child_id: ${selectedChildId}, actual: ${recordData.child_id}`
          );
        } else {
          throw new Error("Delete returned 0 rows and record does not exist. It may have already been deleted.");
        }
      }

      // Log delete result BEFORE verification
      if (deleteError) {
        console.error("[tasks:delete] Delete FAILED:", {
          taskId,
          error: deleteError,
          errorCode: deleteError.code,
          errorMessage: deleteError.message,
          errorDetails: deleteError.details,
          errorHint: deleteError.hint,
          status: (deleteError as { status?: number }).status,
        });
        throw deleteError;
      }

      console.log("[tasks:delete] Delete response:", {
        taskId,
        deletedCount: deleteData?.length || 0,
        deletedData: deleteData,
        deletedIds: deleteData?.map((d) => d.id) || [],
      });

      // Step 3: Verify deletion in the SAME table with the SAME filter
      // If we deleted from child_tasks, verify in child_tasks
      if (!deleteData || deleteData.length === 0) {
        console.error("[tasks:delete] Delete returned no data - nothing was deleted!", {
          taskId,
        });
        throw new Error("Delete operation returned no data. The task may not have been deleted.");
      }

      // Verify: check if the deleted record still exists
      const { data: verifyData, error: verifyError } = await supabase
        .from("child_tasks")
        .select("id, child_id, task_id, parent_id")
        .eq("id", taskId) // Same filter as delete
        .maybeSingle();

      if (verifyError) {
        console.error("[tasks:delete] Verification query error:", {
          taskId,
          error: verifyError,
          errorCode: verifyError.code,
          errorMessage: verifyError.message,
        });
        // If verification query fails, we can't confirm, but delete might have worked
        // Log warning but don't throw - the delete response said it worked
        console.warn("[tasks:delete] Verification query failed, but delete response was successful");
      } else if (verifyData) {
        console.error("[tasks:delete] VERIFICATION FAILED: Task still exists after delete!", {
          taskId,
          verifyData,
          deleteResponse: deleteData,
        });
        throw new Error(`Delete verification failed: task ${taskId} still exists in child_tasks table`);
      } else {
        console.log("[tasks:delete] Verification OK: task no longer exists in child_tasks", {
          taskId,
          deletedCount: deleteData.length,
        });
      }

      // Only update UI if delete was successful and verified
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      toast({
        title: "Task assignment deleted",
        description: "The task assignment has been removed.",
      });
    } catch (cause) {
      console.error("[tasks:delete] Delete failed:", {
        taskId,
        error: cause,
        isRLSError: cause && typeof cause === "object" && "code" in cause && (cause as { code?: string }).code === "42501",
      });

      const errorMessage = cause instanceof Error ? cause.message : String(cause);
      const isRLSError = cause && typeof cause === "object" && "code" in cause && (cause as { code?: string }).code === "42501";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: isRLSError
          ? "Permission denied. You may not have permission to delete this task."
          : errorMessage || "Could not delete task. Please try again.",
      });
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <main className="screen-shell text-white page-content">
      <div className="screen-card w-full max-w-2xl space-y-8 px-8 py-10">
        <div className="mb-4">
          <BackButton href="/parent/dashboard" />
        </div>

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
                <Label className="ikido-section-title text-[var(--brand-gold-200)] text-base tracking-normal">
                  Assign Global Tasks
                </Label>
                {loadingGlobalTasks ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-white/70">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading available tasks...</span>
                  </div>
                ) : globalTasks.length === 0 ? (
                  <div className="rounded-xl bg-[#0b2f4c]/50 border border-white/10 p-6 text-center shadow-sm">
                    <p className="text-white/60">No global tasks available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {globalTasks.map((globalTask) => {
                      const isAlreadyAssigned = tasks.some(
                        (t) => t.task_id === globalTask.id
                      );
                      const isAssigning = assigningTaskId === globalTask.id;

                      return (
                        <TaskCard
                          key={globalTask.id}
                          task={globalTask}
                          isAlreadyAssigned={isAlreadyAssigned}
                          isAssigning={isAssigning}
                          onAssign={handleAssignGlobalTask}
                          onDelete={handleDeleteGlobalTask}
                        />
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
                  GGPoints (1-100)
                </Label>
                <Input
                  id="task-points"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={taskPoints}
                  onChange={(e) => {
                    // Only allow digits, allow empty during editing
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setTaskPoints(value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    // Block non-numeric keys (except backspace, delete, arrow keys, tab)
                    if (
                      !/[0-9]/.test(e.key) &&
                      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key) &&
                      !(e.ctrlKey || e.metaKey) // Allow Ctrl/Cmd combinations
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => {
                    // Clamp to 1-100 on blur
                    const numValue = Number.parseInt(taskPoints, 10) || 0;
                    const clamped = Math.max(1, Math.min(100, numValue));
                    setTaskPoints(String(clamped));
                  }}
                  required
                  className={`h-12 rounded-3xl border-2 bg-[#1a5fa0]/40 text-white ${
                    (() => {
                      const numValue = Number.parseInt(taskPoints, 10) || 0;
                      return numValue < 1 || numValue > 100
                        ? "border-red-400 focus:border-red-400"
                        : "border-[var(--brand-gold-400)]";
                    })()
                  }`}
                />
                {(() => {
                  const numValue = Number.parseInt(taskPoints, 10) || 0;
                  return numValue < 1 || numValue > 100 || taskPoints === "" ? (
                    <p className="text-xs text-red-300 mt-1">
                      GGPoints must be between 1 and 100
                    </p>
                  ) : (
                    <p className="text-xs text-white/60 mt-1">
                      Enter a value between 1 and 100
                    </p>
                  );
                })()}
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
                    className="rounded-2xl border-2 border-[var(--brand-gold-400)] bg-[#0b2f4c] p-5"
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
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editPoints}
                            onChange={(e) => {
                              // Only allow digits, allow empty during editing
                              const value = e.target.value.replace(/[^0-9]/g, "");
                              setEditPoints(value);
                            }}
                            onKeyDown={(e) => {
                              // Block non-numeric keys (except backspace, delete, arrow keys, tab)
                              if (
                                !/[0-9]/.test(e.key) &&
                                !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key) &&
                                !(e.ctrlKey || e.metaKey) // Allow Ctrl/Cmd combinations
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onBlur={() => {
                              // Clamp to 1-100 on blur
                              const numValue = Number.parseInt(editPoints, 10) || 0;
                              const clamped = Math.max(1, Math.min(100, numValue));
                              setEditPoints(String(clamped));
                            }}
                            className={`h-10 w-24 rounded-2xl border-2 bg-[#1a5fa0]/40 text-white ${
                              (() => {
                                const numValue = Number.parseInt(editPoints, 10) || 0;
                                return numValue < 1 || numValue > 100
                                  ? "border-red-400"
                                  : "border-[var(--brand-gold-400)]";
                              })()
                            }`}
                          />
                          <span className="text-sm text-white/70">GGPoints (1-100)</span>
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
      <ScrollToTopButton />
    </main>
  );
};

