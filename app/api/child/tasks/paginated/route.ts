/**
 * POST /api/child/tasks/paginated
 * 
 * OPTIMIZED: Lists tasks assigned to a child with pagination
 * Use this instead of /api/child/tasks for better performance with large task lists
 * 
 * Body: {
 *   child_code: string,
 *   family_code: string,
 *   limit?: number (default: 20),
 *   cursor?: string (assigned_at timestamp for pagination),
 *   filter?: "all" | "pending" | "completed" | "approved"
 * }
 * 
 * Returns:
 * {
 *   tasks: [...],
 *   ggpoints: number,
 *   nextCursor?: string,
 *   hasMore: boolean,
 *   totalCount: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  getTasksAndPointsForChildByCodesPaginated,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository.paginated";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      child_code?: string;
      family_code?: string;
      limit?: number;
      cursor?: string;
      filter?: "all" | "pending" | "completed" | "approved";
    };

    if (!body.child_code || !body.family_code) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "child_code and family_code are required",
        },
        { status: 400 }
      );
    }

    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (envError) {
      console.error("[child:tasks:paginated] Environment configuration error:", envError);
      return NextResponse.json(
        {
          error: "CONFIGURATION_ERROR",
          message: envError instanceof Error ? envError.message : "Server configuration error. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    console.log("[child:tasks:paginated] Fetching tasks for child", {
      child_code: body.child_code,
      family_code: body.family_code,
      limit: body.limit,
      cursor: body.cursor,
      filter: body.filter,
    });

    // OPTIMIZED: Single query with pagination
    const { tasks, totalPoints, childId, nextCursor, hasMore, totalCount } = 
      await getTasksAndPointsForChildByCodesPaginated({
        childCode: body.child_code,
        familyCode: body.family_code,
        supabase: adminClient,
        limit: body.limit,
        cursor: body.cursor,
        filter: body.filter,
      });

    console.log("[child:tasks:paginated] Found tasks", {
      count: tasks.length,
      total_points: totalPoints,
      child_id: childId,
      has_more: hasMore,
      next_cursor: nextCursor,
      total_count: totalCount,
    });

    // Transform tasks to the required format
    const formattedTasks = tasks.map((task) => {
      const taskPoints = task.task?.points ?? 0;
      
      return {
        child_task_id: task.id,
        task_id: task.task_id,
        title: task.task?.title || "Unknown Task",
        description: task.task?.description || null,
        points: taskPoints,
        completed: task.completed,
        completed_at: task.completed_at,
        created_at: task.created_at,
      };
    });

    return NextResponse.json(
      {
        tasks: formattedTasks,
        ggpoints: totalPoints,
        nextCursor,
        hasMore,
        totalCount,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ChildTaskError) {
      console.error("[child:tasks:paginated] Error", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "CHILD_TASK_NOT_FOUND") status = 404;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[child:tasks:paginated] Unexpected error", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: `Failed to list tasks for child: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

