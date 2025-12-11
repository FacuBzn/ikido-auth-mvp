/**
 * POST /api/parent/tasks/approve
 * 
 * Approves a completed task and adds points to child
 * Body: { child_task_id: string }
 * 
 * Uses RPC function for atomic operation:
 * 1. Update child_task.status = 'approved'
 * 2. Insert into ggpoints_ledger
 * 3. Update child.points_balance
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import {
  approveTaskAndAddPoints,
  PointsError,
} from "@/lib/repositories/pointsRepository";

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
          message: "Only parents can approve tasks",
        },
        { status: 403 }
      );
    }

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

    const { supabase } = createSupabaseRouteHandlerClient(request);

    console.log("[tasks:approve] Parent approving task", {
      parent_id: authUser.user.id,
      child_task_id: body.child_task_id,
    });

    await approveTaskAndAddPoints({
      parentAuthId: authUser.user.id,
      childTaskId: body.child_task_id,
      supabase,
    });

    console.log("[tasks:approve] Task approved and points added", {
      child_task_id: body.child_task_id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task approved and points added",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PointsError) {
      console.error("[tasks:approve] Error", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "CHILD_TASK_NOT_FOUND") status = 404;
      else if (error.code === "INVALID_POINTS" || error.code === "INVALID_STATUS") status = 400;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[tasks:approve] Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to approve task" },
      { status: 500 }
    );
  }
}

