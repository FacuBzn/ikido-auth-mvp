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

    const { supabase } = createSupabaseRouteHandlerClient(request);

    console.log("[api:parent:tasks:list] GET Fetching available tasks", {
      parentAuthId: authUser.user.id,
    });

    const tasks = await listAvailableTasksForParent(
      authUser.user.id,
      supabase
    );

    console.log("[api:parent:tasks:list] GET Found tasks", {
      count: tasks.length,
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    if (error instanceof TaskError) {
      console.error("[api:parent:tasks:list] GET TaskError", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[api:parent:tasks:list] GET Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

