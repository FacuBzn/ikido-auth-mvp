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

    console.log("[tasks:assign] Parent assigning task", {
      parent_id: authUser.user.id,
      task_id: body.task_id,
      child_ids: childIds,
      points: body.points,
    });

    const childTasks = await assignTaskToChildren({
      parentAuthId: authUser.user.id,
      taskId: body.task_id,
      childIds,
      supabase,
    });

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

