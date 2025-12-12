/**
 * PAGINATED CHILD TASK REPOSITORY
 * 
 * Optional enhancement for better performance with large task lists.
 * Use this instead of childTaskRepository.ts if you have children with 50+ tasks.
 * 
 * Benefits:
 * - 90% smaller payload (20 vs 200 items)
 * - Faster initial load
 * - Better mobile experience
 * - Infinite scroll support
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { ChildTaskInstance } from "@/lib/types/tasks";
import { ChildTaskError } from "@/lib/repositories/childTaskRepository";

type Db = Database["public"]["Tables"];
type ChildTaskRow = Db["child_tasks"]["Row"];
type TaskRow = Db["tasks"]["Row"];

type ChildTaskRowWithTask = Omit<ChildTaskRow, 'approved_at'> & {
  approved_at?: string | null;
  tasks?: Pick<TaskRow, 'id' | 'title' | 'description' | 'points' | 'is_global'> | null;
};

const mapChildTaskRow = (
  row: ChildTaskRow | ChildTaskRowWithTask,
  task?: Pick<TaskRow, 'id' | 'title' | 'description' | 'points' | 'is_global'>
): ChildTaskInstance => {
  const status = row.status || "pending";
  const completed = status === "completed" || status === "approved";
  
  return {
    id: row.id,
    child_user_id: row.child_id,
    task_id: row.task_id,
    completed,
    completed_at: row.completed_at,
    created_at: row.assigned_at,
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
 * OPTIMIZED PAGINATED: Get tasks and total points with cursor-based pagination
 */
export async function getTasksAndPointsForChildByCodesPaginated(params: {
  childCode: string;
  familyCode: string;
  supabase: SupabaseClient<Database>;
  limit?: number;
  cursor?: string; // assigned_at timestamp for cursor-based pagination
  filter?: "all" | "pending" | "completed" | "approved";
}): Promise<{
  tasks: ChildTaskInstance[];
  totalPoints: number;
  childId: string;
  nextCursor?: string;
  hasMore: boolean;
  totalCount: number;
}> {
  const { childCode, familyCode, supabase, filter = "all" } = params;
  const limit = params.limit || 20;

  console.log("[child_tasks:paginated] Fetching tasks", {
    childCode,
    familyCode,
    limit,
    cursor: params.cursor,
    filter,
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

  if (child.family_code !== familyCode.toUpperCase()) {
    throw new ChildTaskError("UNAUTHORIZED", "Invalid family code");
  }

  // Build base query
  let query = supabase
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
    `,
      { count: "exact" } // Get total count
    )
    .eq("child_id", child.id);

  // Apply status filter
  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  // Apply cursor for pagination
  if (params.cursor) {
    query = query.lt("assigned_at", params.cursor);
  }

  // Order and limit
  // Fetch limit + 1 to check if there are more results
  query = query.order("assigned_at", { ascending: false }).limit(limit + 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[child_tasks:paginated] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch tasks: ${error.message}`);
  }

  // Check if there are more results
  const hasMore = (data || []).length > limit;
  const tasks = hasMore ? (data || []).slice(0, limit) : (data || []);
  const nextCursor = hasMore && tasks.length > 0
    ? tasks[tasks.length - 1].assigned_at
    : undefined;

  // Calculate total points from ALL completed/approved tasks
  // Note: This is a separate lightweight query just for the sum
  const { data: pointsData, error: pointsError } = await supabase
    .from("child_tasks")
    .select("points, status")
    .eq("child_id", child.id)
    .in("status", ["completed", "approved"]);

  let totalPoints = 0;
  if (!pointsError && pointsData) {
    totalPoints = pointsData.reduce((sum, task) => {
      const points = task.points || 0;
      return sum + (typeof points === "number" && !Number.isNaN(points) ? points : 0);
    }, 0);
  }

  const mappedTasks = tasks.map((row: ChildTaskRowWithTask) =>
    mapChildTaskRow(row, row.tasks || undefined)
  );

  console.log("[child_tasks:paginated] Result", {
    child_id: child.id,
    tasks_count: mappedTasks.length,
    total_points: totalPoints,
    has_more: hasMore,
    next_cursor: nextCursor,
    total_count: count || 0,
  });

  return {
    tasks: mappedTasks,
    totalPoints,
    childId: child.id,
    nextCursor,
    hasMore,
    totalCount: count || 0,
  };
}

/**
 * OPTIMIZED: Get task counts by status (for dashboard stats)
 */
export async function getTaskStatsByChildCodes(params: {
  childCode: string;
  familyCode: string;
  supabase: SupabaseClient<Database>;
}): Promise<{
  total: number;
  pending: number;
  completed: number;
  approved: number;
  totalPoints: number;
}> {
  const { childCode, familyCode, supabase } = params;

  // Find child by codes
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

  // Single query to get all tasks with status
  const { data, error } = await supabase
    .from("child_tasks")
    .select("status, points")
    .eq("child_id", child.id);

  if (error) {
    console.error("[child_tasks:stats] Error:", error);
    throw new ChildTaskError("DATABASE_ERROR", `Failed to fetch stats: ${error.message}`);
  }

  // Calculate stats in memory (faster than separate queries)
  const stats = {
    total: data?.length || 0,
    pending: 0,
    completed: 0,
    approved: 0,
    totalPoints: 0,
  };

  (data || []).forEach((task) => {
    const status = task.status || "pending";
    
    if (status === "pending") stats.pending++;
    else if (status === "completed") stats.completed++;
    else if (status === "approved") stats.approved++;

    // Count points only from completed/approved tasks
    if (status === "completed" || status === "approved") {
      const points = task.points || 0;
      stats.totalPoints += typeof points === "number" && !Number.isNaN(points) ? points : 0;
    }
  });

  console.log("[child_tasks:stats] Result", stats);

  return stats;
}

// Re-export ChildTaskError for convenience
export { ChildTaskError };
