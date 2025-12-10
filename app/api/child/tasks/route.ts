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
    });

    const tasks = await getTasksForChildByCodes({
      childCode: body.child_code,
      familyCode: body.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks] Found tasks", {
      count: tasks.length,
    });

    // Transform tasks to the required format
    const formattedTasks = tasks.map((task) => ({
      child_task_id: task.id,
      task_id: task.task_id,
      title: task.task?.title || "Unknown Task",
      description: task.task?.description || null,
      points: task.task?.points || 0,
      completed: task.completed,
      completed_at: task.completed_at,
      created_at: task.created_at,
    }));

    return NextResponse.json(
      {
        tasks: formattedTasks,
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
    if (
      errorMessage.includes("Could not find the table") ||
      errorMessage.includes("does not exist")
    ) {
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message:
            "Database tables not found. Please ensure the SQL migrations have been executed in Supabase SQL Editor.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to list tasks for child",
      },
      { status: 500 }
    );
  }
}
