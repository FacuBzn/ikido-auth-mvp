/**
 * POST /api/parent/tasks/delete
 * 
 * Deletes or hides a task based on its type:
 * - Global tasks (is_global = true): Hidden (soft delete visual) via child_hidden_tasks (per child)
 *   Requires childId in request body
 * - Custom tasks (is_global = false, created_by_parent_id = auth.uid()): Hard delete
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import {
  hideGlobalTaskForChild,
  deleteCustomTask,
  getTaskById,
  TaskError,
} from "@/lib/repositories/taskRepository";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can delete tasks" },
        { status: 403 }
      );
    }

    const { supabase } = createSupabaseRouteHandlerClient(request);

    const body = await request.json();
    const { taskId, childId } = body;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Task ID is required" },
        { status: 400 }
      );
    }

    console.log("[api:parent:tasks:delete] POST Deleting/hiding task", {
      taskId,
      childId: childId || "none",
      parentAuthId: authUser.user.id,
    });

    // First, get the task to determine its type
    const task = await getTaskById(taskId, authUser.user.id, supabase);

    console.log("[api:parent:tasks:delete] Task details", {
      taskId,
      isGlobal: task.is_global,
    });

    // Branch based on task type
    if (task.is_global) {
      // Global task: Hide it for the specific child (soft delete visual per child)
      if (!childId || typeof childId !== "string") {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "childId is required for hiding global tasks" },
          { status: 400 }
        );
      }

      await hideGlobalTaskForChild({
        parentAuthId: authUser.user.id,
        childId,
        taskId,
        supabase,
      });

      console.log("[api:parent:tasks:delete] Task hidden successfully for child", {
        taskId,
        childId,
      });

      return NextResponse.json(
        {
          success: true,
          action: "hidden",
          message: "Task has been hidden for this child",
        },
        { status: 200 }
      );
    } else {
      // Custom task: Hard delete
      await deleteCustomTask({
        parentAuthId: authUser.user.id,
        taskId,
        supabase,
      });

      console.log("[api:parent:tasks:delete] Task deleted successfully", {
        taskId,
      });

      return NextResponse.json(
        {
          success: true,
          action: "deleted",
          message: "Task has been permanently deleted",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof TaskError) {
      console.error("[api:parent:tasks:delete] POST TaskError", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "TASK_NOT_FOUND") status = 404;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[api:parent:tasks:delete] POST Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to delete/hide task" },
      { status: 500 }
    );
  }
}

