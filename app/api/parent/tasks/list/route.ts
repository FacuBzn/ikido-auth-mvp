/**
 * GET /api/parent/tasks/list
 * 
 * Lists all available tasks for parent:
 * - Global task templates
 * - Parent's custom task templates
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import {
  listAvailableTasksForParent,
  TaskError,
} from "@/lib/repositories/taskRepository";

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
        { error: "FORBIDDEN", message: "Only parents can access tasks" },
        { status: 403 }
      );
    }

    // Get pagination params and childId from query
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 100); // Max 100, default 5
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const childId = searchParams.get("childId") || undefined;

    const { supabase } = createSupabaseRouteHandlerClient(request);

    console.log("[api:parent:tasks:list] GET Fetching available tasks", {
      parentAuthId: authUser.user.id,
      childId: childId || "none (all children)",
      limit,
      offset,
    });

    // Get all tasks (repository handles hidden tasks filtering per child)
    const allTasks = await listAvailableTasksForParent(
      authUser.user.id,
      supabase,
      childId ? { childId } : undefined
    );

    // Apply pagination in memory (after filtering hidden tasks)
    const total = allTasks.length;
    const tasks = allTasks.slice(offset, offset + limit);

    console.log("[api:parent:tasks:list] GET Found tasks", {
      count: tasks.length,
      total,
      limit,
      offset,
    });

    return NextResponse.json(
      { tasks, total, limit, offset },
      { status: 200 }
    );
  } catch (error) {

    if (error instanceof TaskError) {
      console.error("[api:parent:tasks:list] GET TaskError", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;
      else if (error.code === "DATABASE_ERROR") status = 503; // Service unavailable for DB errors

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    // Handle timeout/network errors
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("fetch failed")) {
        console.error("[api:parent:tasks:list] GET Timeout/Network error", error);
        return NextResponse.json(
          { error: "TIMEOUT", message: "Connection timeout. Please try again." },
          { status: 503 }
        );
      }
    }

    console.error("[api:parent:tasks:list] GET Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

