/**
 * POST /api/parent/tasks/assign
 * 
 * Assigns a task template to one or more children
 * Body: { task_id: string, child_user_id: string | string[], points?: number }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import {
  assignTaskToChildren,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";

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
        {
          error: "FORBIDDEN",
          message: "Only parents can assign tasks to children",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      task_id?: string;
      child_user_id?: string | string[];
      points?: number;
    };

    if (!body.task_id || !body.child_user_id) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "task_id and child_user_id are required",
        },
        { status: 400 }
      );
    }

    // Validate points if provided
    if (body.points !== undefined) {
      if (typeof body.points !== "number" || Number.isNaN(body.points)) {
        return NextResponse.json(
          {
            error: "INVALID_POINTS",
            message: "Points must be a number between 1 and 100.",
          },
          { status: 400 }
        );
      }
      if (body.points < 1 || body.points > 100) {
        return NextResponse.json(
          {
            error: "INVALID_POINTS",
            message: "Points must be a number between 1 and 100.",
          },
          { status: 400 }
        );
      }
    }

    const childIds = Array.isArray(body.child_user_id)
      ? body.child_user_id
      : [body.child_user_id];

    if (childIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const { supabase } = createSupabaseRouteHandlerClient(request);

    // Part A: Get parent_id DIRECTLY from authenticated session (NEVER from client)
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const hasUser = !!authData?.user;
    const userId = authData?.user?.id ? `${authData.user.id.substring(0, 8)}...` : "none";

    console.log("[tasks:assign] Auth check", {
      hasUser,
      userId,
      authError: authError ? { message: authError.message, status: authError.status } : null,
    });

    if (!hasUser || authError || !authData.user) {
      console.error("[tasks:assign] Authentication failed", {
        hasUser,
        authError,
      });
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication failed" },
        { status: 401 }
      );
    }

    // Get parent_id from session - NEVER trust client
    const parentAuthId = authData.user.id; // This is auth.uid()

    // Get parent internal id from auth_id
    const { data: parentData, error: parentError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", parentAuthId)
      .eq("role", "parent")
      .single();

    if (parentError || !parentData) {
      console.error("[tasks:assign] Parent not found", {
        parentAuthId,
        parentError,
      });
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Parent not found" },
        { status: 403 }
      );
    }

    const parentId = parentData.id; // Internal id from session, NOT from client

    console.log("[tasks:assign] Parent assigning task", {
      parent_auth_id: parentAuthId,
      parent_internal_id: parentId,
      task_id: body.task_id,
      child_ids: childIds,
      points: body.points,
    });

    const childTasks = await assignTaskToChildren({
      parentAuthId,
      parentId, // Pass internal id from session
      taskId: body.task_id,
      childIds,
      supabase,
    });

    // Fix: Don't return 201 if no tasks were assigned (error handling bug)
    if (childTasks.length === 0) {
      console.error("[tasks:assign] No tasks assigned", {
        childIds,
        taskId: body.task_id,
      });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to assign task to any child" },
        { status: 500 }
      );
    }

    console.log("[tasks:assign] Assignment successful", {
      assigned_count: childTasks.length,
    });

    return NextResponse.json(childTasks, { status: 201 });
  } catch (error) {
    if (error instanceof ChildTaskError) {
      console.error("[tasks:assign] Error", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (
        error.code === "TASK_NOT_FOUND" ||
        error.code === "CHILD_TASK_NOT_FOUND"
      )
        status = 404;
      else if (error.code === "INVALID_POINTS") status = 400;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[tasks:assign] Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to assign task" },
      { status: 500 }
    );
  }
}

