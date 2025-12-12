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
 * LIST ALL AVAILABLE TASKS FOR PARENT
 * Returns all global tasks
 */
export async function listAvailableTasksForParent(
  parentAuthId: string,
  supabase: SupabaseClient<Database>
): Promise<TaskTemplate[]> {
  console.log("[tasks:listAvailableTasksForParent] Fetching tasks", {
    parentAuthId,
  });

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_global", true)
    .order("title");

  if (error) {
    console.error("[tasks:listAvailableTasksForParent] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to fetch tasks");
  }

  return data.map(mapTaskRow);
}

/**
 * GET TASK BY ID
 * Verifies parent has access (global or owns it)
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

  // Verify access: must be global
  if (!data.is_global) {
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
 * DELETE CUSTOM TASK
 * Deletes a custom task (only if owned by this parent)
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
    .select("id")
    .eq("id", taskId)
    .eq("is_global", false)
    .single();

  if (!existing) {
    throw new TaskError(
      "TASK_NOT_FOUND",
      "Custom task not found or you don't own it"
    );
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[tasks:deleteCustomTask] Error:", error);
    throw new TaskError("DATABASE_ERROR", "Failed to delete custom task");
  }
}
