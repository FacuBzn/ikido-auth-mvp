/**
 * CHILD TASK REPOSITORY
 * 
 * Handles CHILD_TASKS (task instances assigned to children).
 * Schema REAL (verified from Supabase database):
 * - id: uuid
 * - task_id: uuid (FK to tasks)
 * - child_id: uuid (FK to users)
 * - parent_id: uuid (FK to users)
 * - status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
 * - points: integer (1-100)
 * - assigned_at: timestamptz (or created_at if assigned_at doesn't exist)
 * - completed_at: timestamptz | null
 * 
 * NOTE: approved_at column does NOT exist in the actual database.
 * Use status = 'approved' to check if a task is approved.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { ChildTaskInstance } from "@/lib/types/tasks";
import { getCurrentPeriodKey, getWeekStartDateUTC } from "@/lib/utils/period";

type Db = Database["public"]["Tables"];
type ChildTaskRow = Db["child_tasks"]["Row"];
type TaskRow = Db["tasks"]["Row"];

// Type for child_tasks query result with joined tasks
// NOTE: approved_at, period_key, and assigned_for_date may not be included in all queries, so they're optional here
// tasks is a partial TaskRow since we only select specific fields
type ChildTaskRowWithTask = Omit<ChildTaskRow, 'approved_at' | 'period_key' | 'assigned_for_date'> & {
  approved_at?: string | null;
  period_key?: string;
  assigned_for_date?: string;
  tasks?: Pick<TaskRow, 'id' | 'title' | 'description' | 'points' | 'is_global'> | null;
};

export type ChildTaskErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CHILD_TASK_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_POINTS"
  | "DATABASE_ERROR"
  | "TASK_ALREADY_ASSIGNED_FOR_WEEK";

export class ChildTaskError extends Error {
  code: ChildTaskErrorCode;

  constructor(code: ChildTaskErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ChildTaskError";
  }
}

const mapChildTaskRow = (
  row: ChildTaskRow | ChildTaskRowWithTask,
  task?: Pick<TaskRow, 'id' | 'title' | 'description' | 'points' | 'is_global'>
): ChildTaskInstance => {
  // Map from database schema to domain model
  // Database uses: child_id, status, assigned_at
  // Domain model uses: child_user_id, completed, created_at
  const status = row.status || "pending";
  const completed = status === "completed" || status === "approved";
  
  console.log("[child_tasks:mapChildTaskRow] Mapping row", {
    id: row.id,
    child_id: row.child_id,
    status: row.status,
    points: row.points,
    assigned_at: row.assigned_at,
  });
  
  return {
    id: row.id,
    child_user_id: row.child_id, // Map child_id -> child_user_id for domain model
    task_id: row.task_id,
    completed, // boolean derived from status for backward compatibility
    status, // Real status from database
    completed_at: row.completed_at,
    created_at: row.assigned_at, // Use assigned_at as created_at (created_at doesn't exist in schema)
    // Include points from child_tasks.points (assignment-specific points)
    points: row.points ?? 0,
    task: task
      ? {
          id: task.id,
          title: task.title,
          description: task.description,
          points: task.points,
          is_global: task.is_global,
        }
      : undefined,
  };
};

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
 * Validate points value (1-100)
 */
function validatePoints(points: unknown): number {
  if (typeof points !== "number" || Number.isNaN(points)) {
    throw new ChildTaskError(
      "INVALID_POINTS",
      "Points must be a number between 1 and 100."
    );
  }

  if (points < 1 || points > 100) {
    throw new ChildTaskError(
      "INVALID_POINTS",
      "Points must be a number between 1 and 100."
    );
  }

  return points;
}

/**
 * ASSIGN TASK TO CHILD
 * Creates a child_task entry with period_key support for weekly occurrences
 */
export async function assignTaskToChild(params: {
  parentAuthId: string;
  parentId: string; // Internal id from session - NEVER from client
  taskId: string;
  childId: string;
  periodKey?: string; // ISO week key (e.g., "2025-W04"), defaults to current week
  assignedForDate?: string; // Date string YYYY-MM-DD (Monday of week), defaults to current week Monday
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance> {
  const { parentId, taskId, childId, periodKey, assignedForDate, supabase } = params;

  // Calculate period_key and assigned_for_date if not provided
  const finalPeriodKey = periodKey || getCurrentPeriodKey();
  const finalAssignedForDate = assignedForDate || getWeekStartDateUTC();

  // parentId is now passed from route handler (from session), not calculated here

  console.log("[child_tasks:assignTaskToChild] Assigning task", {
    parentId,
    taskId,
    childId,
    periodKey: finalPeriodKey,
    assignedForDate: finalAssignedForDate,
  });

  // 1. Verify task exists and validate points
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new ChildTaskError("TASK_NOT_FOUND", "Task template not found");
  }

  // Validate task points before assignment
  validatePoints(task.points);

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

  // 3. Create child_task assignment with validated points and period_key
  const validatedPoints = validatePoints(task.points);
  
  console.log("[child_tasks:assignTaskToChild] Using schema columns", {
    task_id: taskId,
    child_id: childId,
    parent_id: parentId, // From session (auth.uid()), NOT from client
    points: validatedPoints,
    status: "pending",
    period_key: finalPeriodKey,
    assigned_for_date: finalAssignedForDate,
  });
  
  // parent_id is ALWAYS from session (auth.uid()), NEVER from client
  const insertData: Db["child_tasks"]["Insert"] = {
    task_id: taskId,
    child_id: childId,
    parent_id: parentId, // From session, not client
    status: "pending",
    points: validatedPoints,
    period_key: finalPeriodKey,
    assigned_for_date: finalAssignedForDate,
  };
  
  const { data, error } = await supabase
    .from("child_tasks")
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    // Handle unique constraint violation (23505 = duplicate key violation)
    // This occurs when trying to assign the same task to the same child in the same week
    if (error?.code === "23505" || error?.message?.includes("duplicate key value violates unique constraint")) {
      console.error("[child_tasks:assignTaskToChild] Unique constraint violation (task already assigned for week)", {
        taskId,
        childId,
        periodKey: finalPeriodKey,
        errorCode: error?.code,
        errorMessage: error?.message,
      });
      throw new ChildTaskError(
        "TASK_ALREADY_ASSIGNED_FOR_WEEK",
        `Task already assigned for this week (${finalPeriodKey})`
      );
    }

    console.error("[child_tasks:assignTaskToChild] INSERT Error:", {
      error,
      insertData,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    });
    throw new ChildTaskError(
      "DATABASE_ERROR",
      `Failed to assign task: ${error?.message || "Unknown error"}`
    );
  }

  console.log("[child_tasks:assignTaskToChild] INSERT OK", {
    id: data.id,
    child_id: data.child_id,
    task_id: data.task_id,
    status: data.status,
    points: data.points,
    period_key: data.period_key,
  });

  return mapChildTaskRow(data, task);
}

/**
 * ASSIGN TASK TO MULTIPLE CHILDREN
 */
export async function assignTaskToChildren(params: {
  parentAuthId: string;
  parentId: string; // Internal id from session - NEVER from client
  taskId: string;
  childIds: string[];
  periodKey?: string; // ISO week key (e.g., "2025-W04"), defaults to current week
  assignedForDate?: string; // Date string YYYY-MM-DD (Monday of week), defaults to current week Monday
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance[]> {
  const { parentId, taskId, childIds, periodKey, assignedForDate, supabase } = params;

  if (!childIds || childIds.length === 0) {
    return [];
  }

  console.log("[child_tasks:assignTaskToChildren] Batch assigning", {
    parentId,
    taskId,
    childCount: childIds.length,
    periodKey: periodKey || "currentWeek",
  });

  const results: ChildTaskInstance[] = [];
  for (const childId of childIds) {
    try {
      const assignment = await assignTaskToChild({
        parentAuthId: params.parentAuthId, // Keep for logging
        parentId, // Use internal id from session
        taskId,
        childId,
        periodKey,
        assignedForDate,
        supabase,
      });
      results.push(assignment);
    } catch (error) {
      // If it's a TASK_ALREADY_ASSIGNED_FOR_WEEK error, we should stop trying for other children
      // and propagate the error. Otherwise, log and continue.
      if (error instanceof ChildTaskError && error.code === "TASK_ALREADY_ASSIGNED_FOR_WEEK") {
        // Re-throw to let endpoint handle it
        throw error;
      }
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
  periodKey?: string; // ISO week key (e.g., "2025-W04"), defaults to current week
  supabase: SupabaseClient<Database>;
}): Promise<ChildTaskInstance[]> {
  const { parentAuthId, childId, periodKey, supabase } = params;

  // Default to current week if not provided
  const finalPeriodKey = periodKey || getCurrentPeriodKey();

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[child_tasks:getTasksForChild] Fetching tasks", {
    parentId,
    childId,
    periodKey: finalPeriodKey,
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

  // Query child_tasks with task join, filtered by period_key
  // Using ONLY columns that exist in the database
  const schemaColumns = ["id", "child_id", "task_id", "status", "points", "completed_at", "assigned_at", "period_key", "assigned_for_date"];
  console.log("[child_tasks:getTasksForChild] Querying with schema columns", {
    child_id: childId,
    period_key: finalPeriodKey,
    columns: schemaColumns,
  });
  
  const query = supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_id,
      task_id,
      parent_id,
      status,
      points,
      completed_at,
      assigned_at,
      period_key,
      assigned_for_date,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("child_id", childId)
    .eq("period_key", finalPeriodKey)
    .order("assigned_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[child_tasks:getTasksForChild] SELECT Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      query_columns: schemaColumns,
      attempted_query: "SELECT id, child_id, task_id, parent_id, status, points, completed_at, assigned_at FROM child_tasks",
    });
    
    // Handle schema/column errors
    if (error.message?.includes("does not exist") || error.code === "42703") {
      const missingColumn = error.message.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i)?.[1] || "unknown";
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Column '${missingColumn}' does not exist in child_tasks table. Please verify the database schema. Error: ${error.message}`
      );
    }
    
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch tasks: ${error.message || "Unknown error"}`);
  }

  console.log("[child_tasks:getTasksForChild] Query result", {
    child_id: childId,
    found_count: data?.length || 0,
    has_data: !!data,
  });

  return (
    data?.map((row: ChildTaskRowWithTask) => mapChildTaskRow(row, row.tasks || undefined)) || []
  );
}

/**
 * GET TASKS FOR CHILD (using codes - for child API endpoints)
 * No auth required, uses admin client with SERVICE_ROLE
 */
export async function getTasksForChildByCodes(params: {
  childCode: string;
  familyCode: string;
  periodKey?: string; // ISO week key (e.g., "2025-W04"), defaults to current week
  supabase: SupabaseClient<Database>; // Must be admin client
}): Promise<ChildTaskInstance[]> {
  const { childCode, familyCode, periodKey, supabase } = params;

  // Default to current week if not provided
  const finalPeriodKey = periodKey || getCurrentPeriodKey();

  console.log("[child_tasks:getTasksForChildByCodes] Fetching tasks", {
    childCode,
    familyCode,
    periodKey: finalPeriodKey,
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

  // Query child_tasks with task join, filtered by period_key
  // Using ONLY columns that exist in the database
  const schemaColumns = ["id", "child_id", "task_id", "status", "points", "completed_at", "assigned_at", "period_key", "assigned_for_date"];
  console.log("[child_tasks:getTasksForChildByCodes] Querying child_tasks", {
    child_id: child.id,
    period_key: finalPeriodKey,
    using_columns: schemaColumns,
  });

  const query = supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_id,
      task_id,
      parent_id,
      status,
      points,
      completed_at,
      assigned_at,
      period_key,
      assigned_for_date,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("child_id", child.id)
    .eq("period_key", finalPeriodKey)
    .order("assigned_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[child_tasks:getTasksForChildByCodes] SELECT Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      query_columns: schemaColumns,
      attempted_query: "SELECT id, child_id, task_id, parent_id, status, points, completed_at, assigned_at FROM child_tasks",
    });
    
    // Handle schema cache issues
    if (error.code === "PGRST204" || error.message?.includes("schema cache")) {
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Schema cache issue. PostgREST cache needs refresh. Please restart Supabase (Settings → Restart). Error: ${error.message}`
      );
    }
    
    if (error.message?.includes("does not exist") || error.code === "42703") {
      const missingColumn = error.message.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i)?.[1] || "unknown";
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Column '${missingColumn}' does not exist in child_tasks table. Please verify the database schema matches the expected structure. Error: ${error.message}`
      );
    }
    
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch tasks: ${error.message || "Unknown error"}`);
  }

  console.log("[child_tasks:getTasksForChildByCodes] Query result", {
    child_id: child.id,
    found_count: data?.length || 0,
    has_data: !!data,
    first_task: data && Array.isArray(data) && data.length > 0 ? {
      id: (data[0] as ChildTaskRowWithTask).id,
      child_id: (data[0] as ChildTaskRowWithTask).child_id,
      task_id: (data[0] as ChildTaskRowWithTask).task_id,
      status: (data[0] as ChildTaskRowWithTask).status,
      points: (data[0] as ChildTaskRowWithTask).points,
      assigned_at: (data[0] as ChildTaskRowWithTask).assigned_at,
      completed_at: (data[0] as ChildTaskRowWithTask).completed_at,
      task_title: (data[0] as ChildTaskRowWithTask).tasks?.title,
      has_task_join: !!(data[0] as ChildTaskRowWithTask).tasks,
    } : null,
    schema_columns_used: schemaColumns,
  });

  return (
    data?.map((row: ChildTaskRowWithTask) => mapChildTaskRow(row, row.tasks || undefined)) || []
  );
}

/**
 * OPTIMIZED: Get tasks and total points for child in a single operation
 * This replaces getTasksForChildByCodes + getTotalPointsForChild with 1 query
 */
export async function getTasksAndPointsForChildByCodes(params: {
  childCode: string;
  familyCode: string;
  supabase: SupabaseClient<Database>;
}): Promise<{
  tasks: ChildTaskInstance[];
  totalPoints: number;
  childId: string;
}> {
  const { childCode, familyCode, supabase } = params;

  console.log("[child_tasks:getTasksAndPointsForChildByCodes] Fetching tasks + points", {
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

  // Single query to fetch all child_tasks with joined task data
  const { data, error } = await supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_id,
      task_id,
      parent_id,
      status,
      points,
      completed_at,
      assigned_at,
      tasks!task_id (
        id,
        title,
        description,
        points,
        is_global
      )
    `
    )
    .eq("child_id", child.id)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("[child_tasks:getTasksAndPointsForChildByCodes] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch tasks: ${error.message}`);
  }

  // Calculate total points from completed/approved tasks IN MEMORY
  // This is faster than a separate DB query when we already have the data
  const totalPoints = (data || [])
    .filter((task) => {
      const status = task.status || "pending";
      return status === "completed" || status === "approved";
    })
    .reduce((sum, task) => {
      const points = task.points || 0;
      return sum + (typeof points === "number" && !Number.isNaN(points) ? points : 0);
    }, 0);

  const tasks = (data || []).map((row: ChildTaskRowWithTask) =>
    mapChildTaskRow(row, row.tasks || undefined)
  );

  console.log("[child_tasks:getTasksAndPointsForChildByCodes] Result", {
    child_id: child.id,
    tasks_count: tasks.length,
    total_points: totalPoints,
  });

  return {
    tasks,
    totalPoints,
    childId: child.id,
  };
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
  // Using ONLY columns that exist in the database
  // NOTE: approved_at does NOT exist - removed from SELECT
  const schemaColumns = ["id", "child_id", "task_id", "status", "points", "completed_at", "assigned_at"];
  console.log("[child_tasks:markTaskCompleted] Querying child_task", {
    child_task_id: childTaskId,
    child_id: child.id,
    using_columns: schemaColumns,
    note: "approved_at removed - column does not exist in database",
  });
  
  const { data: childTask, error: taskError } = await supabase
    .from("child_tasks")
    .select(
      `
      id,
      child_id,
      task_id,
      parent_id,
      status,
      points,
      completed_at,
      assigned_at,
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
    .eq("child_id", child.id)
    .single();

  if (taskError || !childTask) {
    throw new ChildTaskError(
      "CHILD_TASK_NOT_FOUND",
      "Task not found or doesn't belong to you"
    );
  }

  // 3. Verify task is not already completed or approved
  const taskData = childTask as ChildTaskRowWithTask;
  const currentStatus = taskData.status || "pending";
  if (currentStatus === "completed" || currentStatus === "approved") {
    throw new ChildTaskError(
      "INVALID_INPUT",
      "Task is already completed or approved"
    );
  }

  // 4. Update to completed status
  console.log("[child_tasks:markTaskCompleted] Updating status", {
    child_task_id: childTaskId,
    new_status: "completed",
  });
  
  const { data, error } = await supabase
    .from("child_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", childTaskId)
    .select()
    .single();
  
  if (error) {
    console.error("[child_tasks:markTaskCompleted] UPDATE Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
    });
  } else {
    console.log("[child_tasks:markTaskCompleted] UPDATE OK", {
      id: data.id,
      status: data.status,
      completed_at: data.completed_at,
    });
  }

  if (error || !data) {
    console.error("[child_tasks:markTaskCompleted] UPDATE Error:", {
      error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      child_task_id: childTaskId,
    });
    
    // Handle schema cache issues
    if (error?.code === "PGRST204" || error?.message?.includes("schema cache")) {
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Schema cache issue. Please run scripts/sql/23-fix-child-tasks-schema.sql and restart Supabase. Error: ${error.message}`
      );
    }
    
    throw new ChildTaskError(
      "DATABASE_ERROR",
      `Failed to mark task complete: ${error?.message || "Unknown error"}`
    );
  }

  return mapChildTaskRow(data, (childTask as ChildTaskRowWithTask).tasks || undefined);
}

/**
 * GET TOTAL POINTS FOR CHILD (RECONCILIATION ONLY)
 * 
 * ⚠️ WARNING: Do NOT use this for user-facing endpoints.
 * Use users.points_balance as the source of truth instead.
 * 
 * This function calculates points by summing child_tasks and is intended
 * ONLY for:
 * - Admin reconciliation scripts
 * - Debugging discrepancies
 * - One-time data migrations
 * 
 * For real-time point queries, always read from users.points_balance directly.
 */
export async function getTotalPointsForChild(params: {
  childId: string;
  supabase: SupabaseClient<Database>;
}): Promise<number> {
  const { childId, supabase } = params;

  console.log("[child_tasks:getTotalPointsForChild] Calculating total points", {
    childId,
    using_columns: ["points", "status"],
    filter_status: ["completed", "approved"],
  });

  const { data, error } = await supabase
    .from("child_tasks")
    .select("points, status")
    .eq("child_id", childId)
    .in("status", ["completed", "approved"]);
  
  if (error) {
    console.error("[child_tasks:getTotalPointsForChild] SELECT Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
    });
  } else {
    console.log("[child_tasks:getTotalPointsForChild] SELECT OK", {
      found_tasks: data?.length || 0,
      tasks: data?.map(t => ({ status: t.status, points: t.points })),
    });
  }

  if (error) {
    console.error("[child_tasks:getTotalPointsForChild] SELECT Error:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      query_columns: ["points", "status"],
      filter: { child_id: childId, status: ["completed", "approved"] },
    });
    
    // Handle schema cache issues
    if (error.code === "PGRST204" || error.message?.includes("schema cache")) {
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Schema cache issue. The column 'child_id' or 'points' may not exist in child_tasks table, or PostgREST cache needs refresh. Please run scripts/sql/23-fix-child-tasks-schema.sql and restart Supabase. Error: ${error.message}`
      );
    }
    
    if (error.message?.includes("does not exist") || error.code === "42703") {
      throw new ChildTaskError(
        "DATABASE_ERROR",
        `Table or column not found. Please ensure the SQL migrations have been executed. Run scripts/sql/23-fix-child-tasks-schema.sql to fix the schema. Error: ${error.message}`
      );
    }
    
    throw new ChildTaskError(
      "DATABASE_ERROR",
      `Failed to calculate total points: ${error.message || "Unknown error"}`
    );
  }

  const totalPoints =
    data?.reduce((sum, task) => {
      // Validate points before summing
      const points = task.points || 0;
      if (typeof points !== "number" || Number.isNaN(points)) {
        console.warn(
          "[child_tasks:getTotalPointsForChild] Invalid points value:",
          points
        );
        return sum;
      }
      return sum + points;
    }, 0) || 0;

  console.log("[child_tasks:getTotalPointsForChild] Total points", {
    childId,
    totalPoints,
  });

  return totalPoints;
}
