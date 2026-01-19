/**
 * GET /api/parent/child-tasks/list
 * 
 * Lists child_tasks for a specific child (server-side, no CORS issues)
 * Replaces direct browser calls to Supabase REST API
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getTasksForChild, ChildTaskError } from "@/lib/repositories/childTaskRepository";
import { getCurrentPeriodKey } from "@/lib/utils/period";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
        { error: "FORBIDDEN", message: "Only parents can access child tasks" },
        { status: 403 }
      );
    }

    // Get child_id and optional period_key from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("child_id");
    const periodKey = searchParams.get("period_key") || undefined;

    if (!childId || typeof childId !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_id is required" },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteHandlerClient(request);

    // Default to current week if period_key not provided
    const finalPeriodKey = periodKey || getCurrentPeriodKey();

    console.log("[api:parent:child-tasks:list] GET Fetching child tasks", {
      parentAuthId: authUser.user.id,
      childId,
      periodKey: finalPeriodKey,
    });

    // Use repository function to get tasks
    const tasks = await getTasksForChild({
      parentAuthId: authUser.user.id,
      childId,
      periodKey: finalPeriodKey,
      supabase,
    });

    console.log("[api:parent:child-tasks:list] GET Found tasks", {
      count: tasks.length,
      childId,
    });

    return NextResponse.json(
      { data: tasks, count: tasks.length },
      { status: 200 }
    );
  } catch (error) {

    if (error instanceof ChildTaskError) {
      console.error("[api:parent:child-tasks:list] GET ChildTaskError", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "CHILD_TASK_NOT_FOUND" || error.code === "TASK_NOT_FOUND") status = 404;
      else if (error.code === "DATABASE_ERROR") status = 503; // Service unavailable for DB errors

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    // Handle timeout/network errors
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("fetch failed")) {
        console.error("[api:parent:child-tasks:list] GET Timeout/Network error", error);
        return NextResponse.json(
          { error: "TIMEOUT", message: "Connection timeout. Please try again." },
          { status: 503 }
        );
      }
    }

    console.error("[api:parent:child-tasks:list] GET Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to fetch child tasks" },
      { status: 500 }
    );
  }
}

