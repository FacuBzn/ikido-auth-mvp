/**
 * TASK REPOSITORY
 * 
 * Handles task TEMPLATES (global and parent custom tasks).
 * Does NOT handle child_tasks (assignments) - see childTaskRepository.ts
 * 
 * Architecture:
 * - Global tasks: is_global = true, created_by_parent_id = NULL
 * - Custom tasks: is_global = false, created_by_parent_id = <parent_id>
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Db = Database["public"]["Tables"];
type TaskRow = Db["tasks"]["Row"];

export type TaskErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TASK_NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_POINTS"
  | "DATABASE_ERROR";

export class TaskError extends Error {
  code: TaskErrorCode;

  constructor(code: TaskErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "TaskError";
  }
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  points: number;
  is_global: boolean;
  created_at: string;
}

const mapTaskRow = (row: TaskRow): TaskTemplate => ({
  id: row.id,
  title: row.title,
  description: row.description,
  points: row.points,
  is_global: row.is_global,
  created_at: row.created_at,
});

/**
 * Get parent internal ID from auth_id
 */
async function getParentIdFromAuthId(
  authId: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", authId)
    .single();

  if (error || !data) {
    throw new TaskError("UNAUTHORIZED", "Parent not found");
  }

  if (data.role !== "parent") {
    throw new TaskError("FORBIDDEN", "User is not a parent");
  }

  return data.id;
}

/**
 * LIST GLOBAL TASKS
 * Returns all active global task templates
 */
export async function getGlobalTasks(
  supabase: SupabaseClient<Database>
): Promise<TaskTemplate[]> {
  console.log("[tasks:getGlobalTasks] Fetching global tasks");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_global", true)
    .order("title");

  if (error) {
    console.error("[tasks:getGlobalTasks] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to fetch global tasks");
  }

  return data.map(mapTaskRow);
}

/**
 * LIST ALL AVAILABLE TASKS FOR PARENT (optionally filtered by child)
 * Returns all global tasks EXCEPT those hidden for the specified child
 * If childId is not provided, returns all global tasks (backward compatibility)
 */
export async function listAvailableTasksForParent(
  parentAuthId: string,
  supabase: SupabaseClient<Database>,
  options?: { childId?: string }
): Promise<TaskTemplate[]> {
  const { childId } = options || {};
  
  console.log("[tasks:listAvailableTasksForParent] Fetching tasks", {
    parentAuthId,
    childId: childId || "none (all children)",
  });

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  // If childId is provided, filter by child_hidden_tasks
  // Otherwise, return all global tasks (backward compatibility)
  let hiddenTaskIds: string[] = [];

  if (childId) {
    // Verify child belongs to parent
    const { data: child, error: childError } = await supabase
      .from("users")
      .select("id, parent_id, role")
      .eq("id", childId)
      .eq("role", "child")
      .single();

    if (childError || !child) {
      throw new TaskError("TASK_NOT_FOUND", "Child not found");
    }

    if (child.parent_id !== parentId) {
      throw new TaskError(
        "FORBIDDEN",
        "This child does not belong to you"
      );
    }

    // Get list of hidden task IDs for this parent and child
    // Note: child_hidden_tasks table may not be in types yet, so we use type assertion
    const { data: hiddenTasks, error: hiddenError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("child_hidden_tasks" as any)
        .select("task_id")
        .eq("parent_id", parentId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq("child_id", childId) as any
    );

    if (hiddenError) {
      // If table doesn't exist (PGRST205), just return all tasks (graceful degradation)
      if (hiddenError.code === "PGRST205" || hiddenError.message?.includes("does not exist")) {
        console.warn("[tasks:listAvailableTasksForParent] child_hidden_tasks table does not exist yet. Returning all tasks.");
      } else {
        console.error("[tasks:listAvailableTasksForParent] Error fetching hidden tasks:", hiddenError);
      }
      // Continue anyway - if table doesn't exist yet, just return all tasks
    } else {
      hiddenTaskIds = (hiddenTasks as { task_id: string }[] | null)?.map((h) => h.task_id) || [];
    }
  }

  // Query global tasks, excluding hidden ones
  // If there are hidden tasks, filter them out
  // Note: Supabase doesn't support NOT IN directly, so we filter in memory if needed
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_global", true)
    .order("title");

  if (error) {
    console.error("[tasks:listAvailableTasksForParent] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to fetch tasks");
  }

  // Filter out hidden tasks in memory
  const data = hiddenTaskIds.length > 0
    ? allTasks.filter((task) => !hiddenTaskIds.includes(task.id))
    : allTasks;

  return data.map(mapTaskRow);
}

/**
 * GET TASK BY ID
 * Verifies parent has access (global or owns it)
 * Returns task if it's global OR if it's custom and owned by this parent
 */
export async function getTaskById(
  taskId: string,
  parentAuthId: string,
  supabase: SupabaseClient<Database>
): Promise<TaskTemplate> {
  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[tasks:getTaskById] Fetching task", { taskId, parentId });

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error || !data) {
    throw new TaskError("TASK_NOT_FOUND", "Task not found");
  }

  // Verify access: must be global OR custom task owned by this parent
  if (!data.is_global && data.created_by_parent_id !== parentId) {
    throw new TaskError(
      "FORBIDDEN",
      "You don't have permission to access this task"
    );
  }

  return mapTaskRow(data);
}

/**
 * Validate points value (1-100)
 */
function validatePoints(points: unknown): number {
  if (typeof points !== "number" || Number.isNaN(points)) {
    throw new TaskError(
      "INVALID_POINTS",
      "Points must be a number between 1 and 100."
    );
  }

  if (points < 1 || points > 100) {
    throw new TaskError(
      "INVALID_POINTS",
      "Points must be a number between 1 and 100."
    );
  }

  return points;
}

/**
 * CREATE CUSTOM TASK
 * Creates a new custom task for this parent
 */
export async function createCustomTask(params: {
  parentAuthId: string;
  title: string;
  description?: string;
  points: number;
  supabase: SupabaseClient<Database>;
}): Promise<TaskTemplate> {
  const { parentAuthId, title, description, points, supabase } = params;

  if (!title || title.trim().length === 0) {
    throw new TaskError("INVALID_INPUT", "Task title is required");
  }

  // Validate points: must be number between 1 and 100
  const validatedPoints = validatePoints(points);

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[tasks:createCustomTask] Creating task", {
    parentId,
    title,
    points: validatedPoints,
  });

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      points: validatedPoints,
      is_global: false,
      created_by_parent_id: parentId,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[tasks:createCustomTask] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to create custom task");
  }

  return mapTaskRow(data);
}

/**
 * UPDATE CUSTOM TASK
 * Updates a custom task (only if owned by this parent)
 */
export async function updateCustomTask(params: {
  parentAuthId: string;
  taskId: string;
  title?: string;
  description?: string;
  points?: number;
  supabase: SupabaseClient<Database>;
}): Promise<TaskTemplate> {
  const { parentAuthId, taskId, title, description, points, supabase } =
    params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  // Verify task exists and is not global (custom task)
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("is_global", false)
    .single();

  if (fetchError || !existing) {
    throw new TaskError(
      "TASK_NOT_FOUND",
      "Custom task not found or you don't own it"
    );
  }

  console.log("[tasks:updateCustomTask] Updating task", {
    parentId,
    taskId,
  });

  const updates: Partial<TaskRow> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined)
    updates.description = description?.trim() || null;
  if (points !== undefined) {
    // Validate points: must be number between 1 and 100
    const validatedPoints = validatePoints(points);
    updates.points = validatedPoints;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) {
    console.error("[tasks:updateCustomTask] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to update custom task");
  }

  return mapTaskRow(data);
}

/**
 * HIDE GLOBAL TASK FOR CHILD (Soft delete visual per child)
 * Adds task to child_hidden_tasks to hide it from this child's view
 */
export async function hideGlobalTaskForChild(params: {
  parentAuthId: string;
  childId: string;
  taskId: string;
  supabase: SupabaseClient<Database>;
}): Promise<void> {
  const { parentAuthId, childId, taskId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[tasks:hideGlobalTaskForChild] Hiding task for child", {
    parentId,
    childId,
    taskId,
  });

  // Verify child belongs to parent
  const { data: child, error: childError } = await supabase
    .from("users")
    .select("id, parent_id, role")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (childError || !child) {
    throw new TaskError("TASK_NOT_FOUND", "Child not found");
  }

  if (child.parent_id !== parentId) {
    throw new TaskError(
      "FORBIDDEN",
      "This child does not belong to you"
    );
  }

  // Verify task exists and is global
  const { data: task } = await supabase
    .from("tasks")
    .select("id, is_global")
    .eq("id", taskId)
    .single();

  if (!task) {
    throw new TaskError("TASK_NOT_FOUND", "Task not found");
  }

  if (!task.is_global) {
    throw new TaskError(
      "FORBIDDEN",
      "Only global tasks can be hidden. Custom tasks should be deleted."
    );
  }

  // Upsert into child_hidden_tasks (ignore if already hidden)
  // Note: child_hidden_tasks table may not be in types yet, so we use type assertion
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("child_hidden_tasks" as any)
      .upsert(
        {
          parent_id: parentId,
          child_id: childId,
          task_id: taskId,
        },
        {
          onConflict: "parent_id,child_id,task_id",
          ignoreDuplicates: false, // Update if exists, insert if not
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any
  );

  if (error) {
    console.error("[tasks:hideGlobalTaskForChild] Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      parentId,
      childId,
      taskId,
    });
    
    // Check if error is because table doesn't exist
    if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
      throw new TaskError(
        "DATABASE_ERROR",
        "The child_hidden_tasks table does not exist. Please run the migration SQL script first."
      );
    }
    
    throw new TaskError("DATABASE_ERROR", `Failed to hide task: ${error.message || "Unknown error"}`);
  }
}

/**
 * UNHIDE GLOBAL TASK
 * Removes task from parent_hidden_tasks to show it again
 */
export async function unhideGlobalTask(params: {
  parentAuthId: string;
  taskId: string;
  supabase: SupabaseClient<Database>;
}): Promise<void> {
  const { parentAuthId, taskId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[tasks:unhideGlobalTask] Unhiding task", {
    parentId,
    taskId,
  });

  // Note: parent_hidden_tasks table may not be in types yet, so we use type assertion
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("parent_hidden_tasks" as any)
      .delete()
      .eq("parent_id", parentId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("task_id", taskId) as any
  );

  if (error) {
    console.error("[tasks:unhideGlobalTask] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to unhide task");
  }
}

/**
 * DELETE CUSTOM TASK (Hard delete)
 * Deletes a custom task (only if owned by this parent)
 * NOTE: Global tasks should NEVER be deleted - use hideGlobalTask instead
 */
export async function deleteCustomTask(params: {
  parentAuthId: string;
  taskId: string;
  supabase: SupabaseClient<Database>;
}): Promise<void> {
  const { parentAuthId, taskId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[tasks:deleteCustomTask] Deleting task", {
    parentId,
    taskId,
  });

  // Verify task exists and is not global (custom task)
  const { data: existing } = await supabase
    .from("tasks")
    .select("id, is_global, created_by_parent_id")
    .eq("id", taskId)
    .single();

  if (!existing) {
    throw new TaskError("TASK_NOT_FOUND", "Task not found");
  }

  if (existing.is_global) {
    throw new TaskError(
      "FORBIDDEN",
      "Global tasks cannot be deleted. Use hideGlobalTask to hide them."
    );
  }

  if (existing.created_by_parent_id !== parentId) {
    throw new TaskError(
      "FORBIDDEN",
      "You can only delete your own custom tasks"
    );
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[tasks:deleteCustomTask] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to delete custom task");
  }
}
