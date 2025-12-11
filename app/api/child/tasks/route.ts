/**
 * POST /api/child/tasks
 * 
 * Lists tasks assigned to a child
 * Body: { child_code: string, family_code: string }
 * 
 * Returns:
 * {
 *   tasks: [
 *     {
 *       child_task_id: string,
 *       task_id: string,
 *       title: string,
 *       description: string | null,
 *       points: number,
 *       completed: boolean,
 *       completed_at: string | null,
 *       created_at: string
 *     }
 *   ]
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  getTasksForChildByCodes,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      child_code?: string;
      family_code?: string;
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

    const adminClient = getSupabaseAdminClient();

    console.log("[child:tasks] Fetching tasks for child", {
      child_code: body.child_code,
      family_code: body.family_code,
    });

    const tasks = await getTasksForChildByCodes({
      childCode: body.child_code,
      familyCode: body.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks] Found tasks", {
      count: tasks.length,
      task_ids: tasks.map(t => t.id),
    });

    // Transform tasks to the required format
    // Use points from child_tasks (assigned points) or fallback to task template points
    const formattedTasks = tasks.map((task) => {
      // Get points from child_task if available, otherwise from task template
      // Note: child_task.points should be available from the query
      const taskPoints = (task as any).points ?? task.task?.points ?? 0;
      
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
    
    console.log("[child:tasks] Formatted tasks", {
      count: formattedTasks.length,
      sample: formattedTasks[0],
    });

    // Get total points for the child
    const { data: childData } = await adminClient
      .from("users")
      .select("id")
      .eq("child_code", body.child_code.toUpperCase())
      .eq("role", "child")
      .single();

    let totalPoints = 0;
    if (childData) {
      try {
        const { getTotalPointsForChild } = await import(
          "@/lib/repositories/childTaskRepository"
        );
        totalPoints = await getTotalPointsForChild({
          childId: childData.id,
          supabase: adminClient,
        });
      } catch (pointsError) {
        console.error("[child:tasks] Failed to get total points:", pointsError);
        // Continue without points if calculation fails
      }
    }

    return NextResponse.json(
      {
        tasks: formattedTasks,
        ggpoints: totalPoints,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ChildTaskError) {
      console.error("[child:tasks] Error", {
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

    console.error("[child:tasks] Unexpected error", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle schema/column errors specifically
    if (
      errorMessage.includes("does not exist") ||
      errorMessage.includes("Could not find the table") ||
      errorMessage.includes("column")
    ) {
      const missingColumn = errorMessage.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i)?.[1] || "unknown";
      console.error("[child:tasks] Schema error detected", {
        missingColumn,
        fullError: errorMessage,
      });
      
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: `Database schema issue: Column '${missingColumn}' does not exist. Please verify the database schema matches the expected structure. Error: ${errorMessage}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: `Failed to list tasks for child: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
