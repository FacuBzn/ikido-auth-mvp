/**
 * POST /api/child/tasks
 * 
 * Lists tasks assigned to a child
 * Requires: Child session cookie (set by /api/child/login)
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
 *   ],
 *   ggpoints: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  getTasksForChildByCodes,
  getTotalPointsForChild,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";
import { requireChildSession } from "@/lib/auth/childSession";

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (envError) {
      console.error("[child:tasks] Environment configuration error:", envError);
      return NextResponse.json(
        {
          error: "CONFIGURATION_ERROR",
          message: envError instanceof Error ? envError.message : "Server configuration error. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    console.log("[child:tasks] Fetching tasks for child", {
      child_id: session.child_id,
      family_code: session.family_code,
    });

    // Get child_code from database for backward compatibility with repository
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("child_code")
      .eq("id", session.child_id)
      .eq("role", "child")
      .single();

    if (childError || !childData || !childData.child_code) {
      console.error("[child:tasks] Failed to get child_code:", childError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to resolve child code",
        },
        { status: 500 }
      );
    }

    const tasks = await getTasksForChildByCodes({
      childCode: childData.child_code,
      familyCode: session.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks] Found tasks", {
      count: tasks.length,
      total_points: totalPoints,
      child_id: childId,
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
    
    console.log("[child:tasks] Formatted tasks", {
      count: formattedTasks.length,
      sample: formattedTasks[0],
    });

    // Get total points for the child
    let totalPoints = 0;
    try {
      totalPoints = await getTotalPointsForChild({
        childId: session.child_id,
        supabase: adminClient,
      });
    } catch (pointsError) {
      console.error("[child:tasks] Failed to get total points:", pointsError);
      // Continue without points if calculation fails
    }

    return NextResponse.json(
      {
        tasks: formattedTasks,
        ggpoints: totalPoints,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle unauthorized (missing session)
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Child session required. Please log in first.",
        },
        { status: 401 }
      );
    }

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
