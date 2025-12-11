/**
 * POINTS REPOSITORY
 * 
 * Handles GGPoints ledger and point operations.
 * 
 * Architecture:
 * - ggpoints_ledger tracks all point movements
 * - users.points_balance is the current total
 * - Points are added when tasks are approved
 * - Uses RPC function for atomic operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Db = Database["public"]["Tables"];
type LedgerRow = Db["ggpoints_ledger"]["Row"];

export type PointsErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CHILD_TASK_NOT_FOUND"
  | "INVALID_POINTS"
  | "INVALID_STATUS"
  | "DATABASE_ERROR";

export class PointsError extends Error {
  code: PointsErrorCode;

  constructor(code: PointsErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "PointsError";
  }
}

export interface GGPointsEntry {
  id: string;
  child_id: string;
  parent_id: string;
  child_task_id: string | null;
  delta: number;
  reason: string | null;
  created_at: string;
}

const mapLedgerRow = (row: LedgerRow): GGPointsEntry => ({
  id: row.id,
  child_id: row.child_id,
  parent_id: row.parent_id,
  child_task_id: row.child_task_id,
  delta: row.delta,
  reason: row.reason,
  created_at: row.created_at,
});

/**
 * Get parent internal ID from auth_id
 */
async function getParentIdFromAuthId(
  authId: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", authId)
    .single();

  if (error || !data) {
    throw new PointsError("UNAUTHORIZED", "Parent not found");
  }

  if (data.role !== "parent") {
    throw new PointsError("FORBIDDEN", "User is not a parent");
  }

  return data.id;
}

/**
 * APPROVE TASK AND ADD POINTS (ATOMIC)
 * Uses RPC function to atomically:
 * 1. Update child_task status to 'approved'
 * 2. Insert entry in ggpoints_ledger
 * 3. Update user.points_balance
 */
export async function approveTaskAndAddPoints(params: {
  parentAuthId: string;
  childTaskId: string;
  supabase: SupabaseClient<Database>;
}): Promise<void> {
  const { parentAuthId, childTaskId, supabase } = params;

  console.log("[points:approveTaskAndAddPoints] Approving task", {
    parentAuthId,
    childTaskId,
  });

  // Call RPC function
  const { error } = await supabase.rpc("approve_child_task_and_add_points", {
    p_child_task_id: childTaskId,
    p_parent_auth_id: parentAuthId,
  });

  if (error) {
    console.error("[points:approveTaskAndAddPoints] RPC Error:", error);

    // Parse error code from exception
    if (error.message.includes("Parent not found")) {
      throw new PointsError("UNAUTHORIZED", "Parent not found");
    }
    if (
      error.message.includes("Child task not found") ||
      error.message.includes("does not belong to this parent")
    ) {
      throw new PointsError(
        "CHILD_TASK_NOT_FOUND",
        "Task not found or doesn't belong to you"
      );
    }
    if (
      error.message.includes("Points must be between 1 and 100") ||
      error.message.includes("Invalid points configuration")
    ) {
      throw new PointsError(
        "INVALID_POINTS",
        "Points must be a number between 1 and 100."
      );
    }
    if (
      error.message.includes("already approved") ||
      error.message.includes("must be completed before approval")
    ) {
      throw new PointsError(
        "INVALID_STATUS",
        error.message || "Task cannot be approved in its current status"
      );
    }

    throw new PointsError("DATABASE_ERROR", "Failed to approve task");
  }

  console.log("[points:approveTaskAndAddPoints] Task approved successfully");
}

/**
 * GET POINTS HISTORY FOR CHILD
 * Returns ledger entries for a specific child
 */
export async function getPointsHistory(params: {
  parentAuthId: string;
  childId: string;
  supabase: SupabaseClient<Database>;
}): Promise<GGPointsEntry[]> {
  const { parentAuthId, childId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[points:getPointsHistory] Fetching history", {
    parentId,
    childId,
  });

  // Verify child belongs to parent
  const { data: child } = await supabase
    .from("users")
    .select("parent_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (!child || child.parent_id !== parentId) {
    throw new PointsError("FORBIDDEN", "This child does not belong to you");
  }

  const { data, error } = await supabase
    .from("ggpoints_ledger")
    .select("*")
    .eq("child_id", childId)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[points:getPointsHistory] Error:", error);
    throw new PointsError("DATABASE_ERROR", "Failed to fetch points history");
  }

  return data.map(mapLedgerRow);
}

/**
 * GET POINTS BALANCE FOR CHILD
 * Returns current points balance from users table
 */
export async function getPointsBalance(params: {
  parentAuthId: string;
  childId: string;
  supabase: SupabaseClient<Database>;
}): Promise<number> {
  const { parentAuthId, childId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[points:getPointsBalance] Getting balance", {
    parentId,
    childId,
  });

  const { data, error } = await supabase
    .from("users")
    .select("points_balance, parent_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (error || !data) {
    throw new PointsError("FORBIDDEN", "Child not found");
  }

  if (data.parent_id !== parentId) {
    throw new PointsError("FORBIDDEN", "This child does not belong to you");
  }

  return data.points_balance || 0;
}

/**
 * GET FAMILY SCOREBOARD
 * Returns all children with their points, ordered by points desc
 */
export async function getFamilyScoreboard(params: {
  parentAuthId: string;
  supabase: SupabaseClient<Database>;
}): Promise<Array<{ id: string; name: string; points: number }>> {
  const { parentAuthId, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[points:getFamilyScoreboard] Getting scoreboard", {
    parentId,
  });

  const { data, error } = await supabase
    .from("users")
    .select("id, name, points_balance")
    .eq("parent_id", parentId)
    .eq("role", "child")
    .order("points_balance", { ascending: false });

  if (error) {
    console.error("[points:getFamilyScoreboard] Error:", error);
    throw new PointsError("DATABASE_ERROR", "Failed to fetch scoreboard");
  }

  return (
    data?.map((child) => ({
      id: child.id,
      name: child.name || "Unknown",
      points: child.points_balance || 0,
    })) || []
  );
}

/**
 * ADD MANUAL POINTS ADJUSTMENT
 * For manual point corrections by parent
 */
export async function addManualPointsAdjustment(params: {
  parentAuthId: string;
  childId: string;
  delta: number;
  reason: string;
  supabase: SupabaseClient<Database>;
}): Promise<GGPointsEntry> {
  const { parentAuthId, childId, delta, reason, supabase } = params;

  const parentId = await getParentIdFromAuthId(parentAuthId, supabase);

  console.log("[points:addManualPointsAdjustment] Adding manual adjustment", {
    parentId,
    childId,
    delta,
  });

  // Verify child belongs to parent
  const { data: child } = await supabase
    .from("users")
    .select("parent_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (!child || child.parent_id !== parentId) {
    throw new PointsError("FORBIDDEN", "This child does not belong to you");
  }

  // Insert ledger entry
  const { data: ledgerEntry, error: ledgerError } = await supabase
    .from("ggpoints_ledger")
    .insert({
      child_id: childId,
      parent_id: parentId,
      child_task_id: null,
      delta,
      reason: reason || "manual_adjustment",
    })
    .select()
    .single();

  if (ledgerError || !ledgerEntry) {
    console.error("[points:addManualPointsAdjustment] Ledger error:", ledgerError);
    throw new PointsError("DATABASE_ERROR", "Failed to create ledger entry");
  }

  // Update user balance
  const { data: currentUser } = await supabase
    .from("users")
    .select("points_balance")
    .eq("id", childId)
    .single();

  if (currentUser) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        points_balance: (currentUser.points_balance || 0) + delta,
      })
      .eq("id", childId);

    if (updateError) {
      console.error(
        "[points:addManualPointsAdjustment] Update error:",
        updateError
      );
      throw new PointsError(
        "DATABASE_ERROR",
        "Failed to update points balance"
      );
    }
  }

  return mapLedgerRow(ledgerEntry);
}

