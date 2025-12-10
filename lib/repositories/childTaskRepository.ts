/**
 * CHILD TASK REPOSITORY
 * 
 * Handles CHILD_TASKS (task instances assigned to children).
 * Schema REAL: id, child_user_id, task_id, completed, completed_at, created_at
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { ChildTaskInstance } from "@/lib/types/tasks";

type Db = Database["public"]["Tables"];
type ChildTaskRow = Db["child_tasks"]["Row"];
type TaskRow = Db["tasks"]["Row"];

export type ChildTaskErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CHILD_TASK_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "INVALID_INPUT"
  | "DATABASE_ERROR";

export class ChildTaskError extends Error {
  code: ChildTaskErrorCode;

  constructor(code: ChildTaskErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ChildTaskError";
  }
}

const mapChildTaskRow = (
  row: any,
  task?: TaskRow
): ChildTaskInstance => ({
  id: row.id,
  child_user_id: row.child_user_id,
  task_id: row.task_id,
  completed: row.completed || false,
  completed_at: row.completed_at,
  created_at: row.created_at,
  task: task
    ? {
        id: task.id,
        title: task.title,
        description: task.description,
        points: task.points,
        is_global: task.is_global,
      }
    : undefined,
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
    throw new ChildTaskError("UNAUTHORIZED", "Parent not found");
  }

  if (data.role !== "parent") {
    throw new ChildTaskError("FORBIDDEN", "User is not a parent");
  }

  return data.id;
}

/**
 * ASSIGN TASK TO CHILD
 * Creates a child_task entry
 */
export async function assignTaskToChild(params: {
  parentAuthId: string;
  taskId: string;
  childId: string;
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance> {
  const { parentAuthId, taskId, childId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[child_tasks:assignTaskToChild] Assigning task", {
    parentId,
    taskId,
    childId,
  });

  // 1. Verify task exists
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new ChildTaskError("TASK_NOT_FOUND", "Task template not found");
  }

  // 2. Verify child belongs to parent
  const { data: child, error: childError } = await supabase
    .from("users")
    .select("id, parent_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (childError || !child) {
    throw new ChildTaskError("FORBIDDEN", "Child not found");
  }

  if (child.parent_id !== parentId) {
    throw new ChildTaskError(
      "FORBIDDEN",
      "This child does not belong to you"
    );
  }

  // 3. Create child_task assignment
  const { data, error } = await supabase
    .from("child_tasks")
    .insert({
      child_user_id: childId,
      task_id: taskId,
      completed: false,
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error("[child_tasks:assignTaskToChild] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", "Failed to assign task");
  }

  return mapChildTaskRow(data, task);
}

/**
 * ASSIGN TASK TO MULTIPLE CHILDREN
 */
export async function assignTaskToChildren(params: {
  parentAuthId: string;
  taskId: string;
  childIds: string[];
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance[]> {
  const { parentAuthId, taskId, childIds, supabase } = params;

  if (!childIds || childIds.length === 0) {
    return [];
  }

  console.log("[child_tasks:assignTaskToChildren] Batch assigning", {
    taskId,
    childCount: childIds.length,
  });

  const results: ChildTaskInstance[] = [];
  for (const childId of childIds) {
    try {
      const assignment = await assignTaskToChild({
        parentAuthId,
        taskId,
        childId,
        supabase,
      });
      results.push(assignment);
    } catch (error) {
      console.error(
        `[child_tasks:assignTaskToChildren] Failed for child ${childId}:`,
        error
      );
    }
  }

  return results;
}

/**
 * GET TASKS FOR CHILD (using child_id directly)
 * Used by parent to view child's tasks
 */
export async function getTasksForChild(params: {
  parentAuthId: string;
  childId: string;
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance[]> {
  const { parentAuthId, childId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[child_tasks:getTasksForChild] Fetching tasks", {
    parentId,
    childId,
  });

  // Verify child belongs to parent
  const { data: child } = await supabase
    .from("users")
    .select("parent_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (!child || child.parent_id !== parentId) {
    throw new ChildTaskError(
      "FORBIDDEN",
      "This child does not belong to you"
    );
  }

  // Query child_tasks with task join
  const { data, error } = await supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_user_id,
      task_id,
      completed,
      completed_at,
      created_at,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("child_user_id", childId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[child_tasks:getTasksForChild] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", "Failed to fetch tasks");
  }

  return (
    data?.map((row: any) => mapChildTaskRow(row, row.tasks || undefined)) || []
  );
}

/**
 * GET TASKS FOR CHILD (using codes - for child API endpoints)
 * No auth required, uses admin client with SERVICE_ROLE
 */
export async function getTasksForChildByCodes(params: {
  childCode: string;
  familyCode: string;
  supabase: SupabaseClient<Database>; // Must be admin client
}): Promise<ChildTaskInstance[]> {
  const { childCode, familyCode, supabase } = params;

  console.log("[child_tasks:getTasksForChildByCodes] Fetching tasks", {
    childCode,
    familyCode,
  });

  // Find child by codes
  const { data: child, error: childError } = await supabase
    .from("users")
    .select("id, parent_id, family_code")
    .eq("child_code", childCode.toUpperCase())
    .eq("role", "child")
    .single();

  if (childError || !child) {
    throw new ChildTaskError("UNAUTHORIZED", "Invalid child credentials");
  }

  // Verify family_code matches
  if (child.family_code !== familyCode.toUpperCase()) {
    throw new ChildTaskError("UNAUTHORIZED", "Invalid family code");
  }

  // Query child_tasks with task join
  console.log("[child_tasks:getTasksForChildByCodes] Querying child_tasks", {
    child_id: child.id,
  });

  const { data, error } = await supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_user_id,
      task_id,
      completed,
      completed_at,
      created_at,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("child_user_id", child.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[child_tasks:getTasksForChildByCodes] Error:", error);
    
    if (error.message?.includes("does not exist") || error.code === "42703") {
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Table or column not found. Please ensure the SQL migrations have been executed. Error: ${error.message}`
      );
    }
    
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch tasks: ${error.message || "Unknown error"}`);
  }

  console.log("[child_tasks:getTasksForChildByCodes] Query result", {
    child_id: child.id,
    found_count: data?.length || 0,
    has_data: !!data,
    first_task: data && Array.isArray(data) && data[0] ? {
      id: (data[0] as any).id,
      child_user_id: (data[0] as any).child_user_id,
      task_id: (data[0] as any).task_id,
      task_title: (data[0] as any).tasks?.title,
    } : null,
  });

  return (
    data?.map((row: any) => mapChildTaskRow(row, row.tasks || undefined)) || []
  );
}

/**
 * MARK TASK AS COMPLETED (by child)
 * Sets completed = true and completed_at timestamp
 */
export async function markTaskCompleted(params: {
  childTaskId: string;
  childCode: string;
  familyCode: string;
  supabase: SupabaseClient<Database>; // Must be admin client
}): Promise<ChildTaskInstance> {
  const { childTaskId, childCode, familyCode, supabase } = params;

  console.log("[child_tasks:markTaskCompleted] Marking task complete", {
    childTaskId,
    childCode,
  });

  // 1. Find child by codes
  const { data: child, error: childError } = await supabase
    .from("users")
    .select("id, family_code")
    .eq("child_code", childCode.toUpperCase())
    .eq("role", "child")
    .single();

  if (childError || !child) {
    throw new ChildTaskError("UNAUTHORIZED", "Invalid child credentials");
  }

  if (child.family_code !== familyCode.toUpperCase()) {
    throw new ChildTaskError("UNAUTHORIZED", "Invalid family code");
  }

  // 2. Verify child_task belongs to this child
  const { data: childTask, error: taskError } = await supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_user_id,
      task_id,
      completed,
      completed_at,
      created_at,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("id", childTaskId)
    .eq("child_user_id", child.id)
    .single();

  if (taskError || !childTask) {
    throw new ChildTaskError(
      "CHILD_TASK_NOT_FOUND",
      "Task not found or doesn't belong to you"
    );
  }

  // 3. Verify task is not already completed
  const taskData = childTask as any;
  if (taskData.completed) {
    throw new ChildTaskError(
      "INVALID_INPUT",
      "Task is already completed"
    );
  }

  // 4. Update to completed
  const { data, error } = await supabase
    .from("child_tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    } as any)
    .eq("id", childTaskId)
    .select()
    .single();

  if (error || !data) {
    console.error("[child_tasks:markTaskCompleted] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", "Failed to mark task complete");
  }

  return mapChildTaskRow(data, (childTask as any).tasks || undefined);
}
