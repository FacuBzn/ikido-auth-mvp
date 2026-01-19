/**
 * GET /api/parent/child-tasks/pending-approval
 *
 * Lists tasks completed by a child that are pending parent approval.
 * Query params: ?child_id=UUID
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child belongs to the authenticated parent
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
 *       completed_at: string
 *     }
 *   ],
 *   child: { id: string, name: string },
 *   ggpoints_child: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getCurrentPeriodKey } from "@/lib/utils/period";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can view pending approvals" },
        { status: 403 }
      );
    }

    // 2. Get child_id and optional period_key from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("child_id");
    const periodKey = searchParams.get("period_key") || undefined;

    if (!childId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_id query parameter is required" },
        { status: 400 }
      );
    }

    // Default to current week if period_key not provided
    const finalPeriodKey = periodKey || getCurrentPeriodKey();

    const adminClient = getSupabaseAdminClient();

    // 3. Get parent's internal ID
    const { data: parentData, error: parentError } = await adminClient
      .from("users")
      .select("id")
      .eq("auth_id", authUser.user.id)
      .eq("role", "parent")
      .single();

    if (parentError || !parentData) {
      console.error("[pending-approval] Parent not found:", parentError);
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Parent record not found" },
        { status: 401 }
      );
    }

    const parentId = parentData.id;

    // 4. Validate child belongs to parent and get child info + points_balance
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, name, parent_id, points_balance")
      .eq("id", childId)
      .eq("role", "child")
      .single();

    if (childError || !childData) {
      console.error("[pending-approval] Child not found:", childError);
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Child not found" },
        { status: 404 }
      );
    }

    if (childData.parent_id !== parentId) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This child does not belong to you" },
        { status: 403 }
      );
    }

    // 5. Get completed tasks pending approval (status = 'completed') for current week
    const { data: tasksData, error: tasksError } = await adminClient
      .from("child_tasks")
      .select(`
        id,
        task_id,
        points,
        completed_at,
        period_key,
        assigned_for_date,
        tasks!task_id (
          id,
          title,
          description
        )
      `)
      .eq("child_id", childId)
      .eq("status", "completed")
      .eq("period_key", finalPeriodKey)
      .order("completed_at", { ascending: false });

    if (tasksError) {
      console.error("[pending-approval] Failed to fetch tasks:", tasksError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to fetch pending tasks" },
        { status: 500 }
      );
    }

    // 6. Format response
    const tasks = (tasksData || []).map((task) => ({
      child_task_id: task.id,
      task_id: task.task_id,
      title: task.tasks?.title || "Unknown Task",
      description: task.tasks?.description || null,
      points: task.points,
      completed_at: task.completed_at,
      period_key: task.period_key, // Include for debug/UI
    }));

    console.log("[pending-approval] Found pending tasks", {
      child_id: childId,
      count: tasks.length,
      ggpoints_child: childData.points_balance,
    });

    return NextResponse.json(
      {
        tasks,
        child: {
          id: childData.id,
          name: childData.name || "Unknown",
        },
        ggpoints_child: childData.points_balance ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[pending-approval] Unexpected error:", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}
