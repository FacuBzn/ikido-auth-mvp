/**
 * POST /api/child/tasks/complete
 * 
 * Marks a task as completed by child
 * Body: { child_task_id: string, child_code: string, family_code: string }
 * 
 * No authentication required - uses admin client with SERVICE_ROLE
 * Does NOT add points - parent must approve first
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  markTaskCompleted,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      child_task_id?: string;
      child_code?: string;
      family_code?: string;
    };

    if (!body.child_task_id || !body.child_code || !body.family_code) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "child_task_id, child_code, and family_code are required",
        },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    console.log("[child:tasks:complete] Marking task complete", {
      child_task_id: body.child_task_id,
      child_code: body.child_code,
    });

    const updatedTask = await markTaskCompleted({
      childTaskId: body.child_task_id,
      childCode: body.child_code,
      familyCode: body.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks:complete] Task marked complete", {
      child_task_id: body.child_task_id,
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
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

