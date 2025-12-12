/**
 * POST /api/child/tasks/complete
 * 
 * Marks a task as completed by child
 * Requires: Child session cookie (set by /api/child/login)
 * Body: { child_task_id: string }
 * 
 * Does NOT add points - parent must approve first
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  markTaskCompleted,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";
import { requireChildSession } from "@/lib/auth/childSession";

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    const body = (await request.json()) as {
      child_task_id?: string;
    };

    if (!body.child_task_id) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "child_task_id is required",
        },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Get child_code from database for backward compatibility with repository
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("child_code")
      .eq("id", session.child_id)
      .eq("role", "child")
      .single();

    if (childError || !childData || !childData.child_code) {
      console.error("[child:tasks:complete] Failed to get child_code:", childError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to resolve child code",
        },
        { status: 500 }
      );
    }

    console.log("[child:tasks:complete] Marking task complete", {
      child_task_id: body.child_task_id,
      child_id: session.child_id,
    });

    const updatedTask = await markTaskCompleted({
      childTaskId: body.child_task_id,
      childCode: childData.child_code,
      familyCode: session.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks:complete] Task marked complete", {
      child_task_id: body.child_task_id,
    });

    return NextResponse.json(updatedTask, { status: 200 });
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
      console.error("[child:tasks:complete] Error", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "CHILD_TASK_NOT_FOUND") status = 404;
      else if (error.code === "INVALID_INPUT") status = 409;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[child:tasks:complete] Unexpected error", error);
    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to complete task",
      },
      { status: 500 }
    );
  }
}

