/**
 * POST /api/parent/tasks/approve
 *
 * Approves a completed task and credits points to the child.
 * Body: { child_task_id: string }
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child_task belongs to a child of the authenticated parent
 *
 * Flow (Idempotent + CAS for safety):
 * 1. Validate auth and ownership
 * 2. If already approved: return 200 { success: true, already_approved: true }
 * 3. If not completed (pending/rejected): return 409 INVALID_STATE
 * 4. UPDATE child_tasks SET status='approved', approved_at WHERE status='completed'
 *    - If 0 rows affected: race condition, return idempotent
 * 5. UPDATE users.points_balance with CAS + 1 retry
 * 6. INSERT ggpoints_ledger (best effort)
 *
 * Returns:
 * - 200: { success: true, child_task_id, points_earned, ggpoints }
 * - 200: { success: true, already_approved: true, ggpoints }
 * - 400: { error: "INVALID_INPUT", message }
 * - 401: { error: "UNAUTHORIZED", message }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "TASK_NOT_FOUND", message }
 * - 409: { error: "INVALID_STATE", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
        { error: "FORBIDDEN", message: "Only parents can approve tasks" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as { child_task_id?: string };

    if (!body.child_task_id) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_task_id is required" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 3. Get parent's internal ID
    const { data: parentData, error: parentError } = await adminClient
      .from("users")
      .select("id")
      .eq("auth_id", authUser.user.id)
      .eq("role", "parent")
      .single();

    if (parentError || !parentData) {
      console.error("[tasks:approve] Parent not found:", parentError);
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Parent record not found" },
        { status: 401 }
      );
    }

    const parentId = parentData.id;

    // 4. Get child_task with task info
    // NOTE: approved_at column does NOT exist in Supabase - using only status
    const { data: childTask, error: taskError } = await adminClient
      .from("child_tasks")
      .select(`
        id,
        task_id,
        child_id,
        parent_id,
        status,
        points,
        completed_at,
        tasks!task_id (
          title
        )
      `)
      .eq("id", body.child_task_id)
      .single();

    if (taskError || !childTask) {
      console.error("[tasks:approve] Task not found:", taskError);
      return NextResponse.json(
        { error: "TASK_NOT_FOUND", message: "Task not found" },
        { status: 404 }
      );
    }

    // 5. Validate ownership (task's parent_id must match auth parent)
    if (childTask.parent_id !== parentId) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This task does not belong to your children" },
        { status: 403 }
      );
    }

    // 6. Get child's current points_balance
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance")
      .eq("id", childTask.child_id)
      .single();

    if (childError || !childData) {
      console.error("[tasks:approve] Child not found:", childError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to get child data" },
        { status: 500 }
      );
    }

    const currentPoints = childData.points_balance ?? 0;

    // 7. If already approved, return idempotent success
    if (childTask.status === "approved") {
      console.log("[tasks:approve] Already approved (idempotent)", {
        child_task_id: body.child_task_id,
      });
      return NextResponse.json(
        {
          success: true,
          already_approved: true,
          child_task_id: body.child_task_id,
          ggpoints: currentPoints,
        },
        { status: 200 }
      );
    }

    // 8. Validate task is completed (not pending, not rejected)
    if (childTask.status !== "completed") {
      return NextResponse.json(
        {
          error: "INVALID_STATE",
          message: `Task must be completed before approval. Current status: ${childTask.status}`,
        },
        { status: 409 }
      );
    }

    const pointsEarned = childTask.points;
    const taskTitle = childTask.tasks?.title || "Unknown Task";

    console.log("[tasks:approve] Approving task", {
      child_task_id: body.child_task_id,
      points_earned: pointsEarned,
      current_balance: currentPoints,
    });

    // ===== ATOMIC APPROVAL SEQUENCE =====

    // Step 1: UPDATE child_tasks SET status='approved' WHERE status='completed'
    // NOTE: approved_at column does NOT exist - using only status field
    const { data: updatedTasks, error: updateTaskError } = await adminClient
      .from("child_tasks")
      .update({
        status: "approved",
      })
      .eq("id", body.child_task_id)
      .eq("status", "completed") // Only if still completed (not already approved)
      .select("id, status");

    if (updateTaskError) {
      console.error("[tasks:approve] Task update failed:", updateTaskError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to approve task" },
        { status: 500 }
      );
    }

    // Check if update affected rows (race condition check)
    if (!updatedTasks || updatedTasks.length === 0) {
      // Another request approved it first - return idempotent
      console.log("[tasks:approve] Race condition: already approved by another request");

      // Refetch current points
      const { data: refetchedChild } = await adminClient
        .from("users")
        .select("points_balance")
        .eq("id", childTask.child_id)
        .single();

      return NextResponse.json(
        {
          success: true,
          already_approved: true,
          child_task_id: body.child_task_id,
          ggpoints: refetchedChild?.points_balance ?? currentPoints,
        },
        { status: 200 }
      );
    }

    // Step 2: UPDATE users.points_balance with CAS + 1 retry
    let pointsUpdateBalance = currentPoints;
    let newBalance = 0;
    let casSuccess = false;
    const MAX_RETRIES = 1;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { data: updatedUsers, error: pointsError } = await adminClient
        .from("users")
        .update({
          points_balance: pointsUpdateBalance + pointsEarned,
        })
        .eq("id", childTask.child_id)
        .eq("points_balance", pointsUpdateBalance) // CAS
        .select("points_balance");

      if (pointsError) {
        console.error("[tasks:approve] Points update failed:", pointsError);
        // ROLLBACK: Revert task approval
        await adminClient
          .from("child_tasks")
          .update({ status: "completed" })
          .eq("id", body.child_task_id);

        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to add points" },
          { status: 500 }
        );
      }

      if (updatedUsers && updatedUsers.length > 0) {
        newBalance = updatedUsers[0].points_balance;
        casSuccess = true;
        console.log("[tasks:approve] CAS succeeded", {
          attempt,
          old_balance: pointsUpdateBalance,
          new_balance: newBalance,
        });
        break;
      }

      // CAS failed - refetch and retry
      console.log("[tasks:approve] CAS failed, refetching", { attempt });

      const { data: refetchedUser } = await adminClient
        .from("users")
        .select("points_balance")
        .eq("id", childTask.child_id)
        .single();

      if (!refetchedUser) {
        // ROLLBACK
        await adminClient
          .from("child_tasks")
          .update({ status: "completed" })
          .eq("id", body.child_task_id);

        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to verify points" },
          { status: 500 }
        );
      }

      if (attempt < MAX_RETRIES) {
        pointsUpdateBalance = refetchedUser.points_balance ?? 0;
        continue;
      }

      // Max retries exceeded
      console.error("[tasks:approve] CAS failed after retries");

      // ROLLBACK
      await adminClient
        .from("child_tasks")
        .update({ status: "completed" })
        .eq("id", body.child_task_id);

      return NextResponse.json(
        {
          error: "CONCURRENT_MODIFICATION",
          message: "Balance changed. Please try again.",
          ggpoints: refetchedUser.points_balance ?? 0,
        },
        { status: 409 }
      );
    }

    // Sanity check
    if (!casSuccess) {
      await adminClient
        .from("child_tasks")
        .update({ status: "completed" })
        .eq("id", body.child_task_id);

      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to process approval" },
        { status: 500 }
      );
    }

    // Step 3: Insert ledger entry (best effort)
    const { error: ledgerError } = await adminClient
      .from("ggpoints_ledger")
      .insert({
        child_id: childTask.child_id,
        parent_id: parentId,
        delta: pointsEarned,
        reason: `Approved task: ${taskTitle}`,
        child_task_id: body.child_task_id,
      });

    if (ledgerError) {
      console.error("[tasks:approve] Ledger insert failed (non-critical):", ledgerError);
      // Continue - approval is still valid
    }

    console.log("[tasks:approve] Task approved successfully", {
      child_task_id: body.child_task_id,
      points_earned: pointsEarned,
      new_balance: newBalance,
    });

    return NextResponse.json(
      {
        success: true,
        child_task_id: body.child_task_id,
        points_earned: pointsEarned,
        ggpoints: newBalance,
        status: "approved",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[tasks:approve] Unexpected error:", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to approve task" },
      { status: 500 }
    );
  }
}
