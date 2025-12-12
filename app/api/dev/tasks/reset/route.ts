/**
 * POST /api/dev/tasks/reset
 * 
 * DEVELOPMENT-ONLY endpoint to reset the entire tasks module for testing.
 * 
 * ⚠️ SECURITY: This endpoint is protected by:
 * 1. API Key authentication (x-admin-key header)
 * 2. Environment check (only available in development)
 * 
 * Operations performed:
 * 1. Delete all child_task assignments
 * 2. Reset all children's points_balance to 0
 * 3. Clear all ggpoints_ledger entries
 * 4. Delete all custom tasks (is_global = false)
 * 5. Preserve global tasks (is_global = true)
 * 
 * Request:
 * - Method: POST
 * - URL: http://localhost:3000/api/dev/tasks/reset
 * - Headers:
 *     x-admin-key: <DEV_ADMIN_KEY from .env.local>
 * - Body: empty
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Tasks, child assignments, and GGPoints have been fully reset for development testing.",
 *   "deleted_child_tasks": N,
 *   "cleared_points": true,
 *   "deleted_ledger_entries": M,
 *   "deleted_custom_tasks": K
 * }
 * 
 * Response (403 FORBIDDEN - Production):
 * {
 *   "error": "FORBIDDEN",
 *   "message": "This endpoint is only available in development mode."
 * }
 * 
 * Response (401 UNAUTHORIZED - Invalid API Key):
 * {
 *   "error": "UNAUTHORIZED",
 *   "message": "Invalid admin key."
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { fullReset, DevError } from "@/lib/repositories/devRepository";

// Admin key from environment (should be set in .env.local)
const DEV_ADMIN_KEY = process.env.DEV_ADMIN_KEY || "dev-reset-key-change-me";

export async function POST(request: NextRequest) {
  try {
    // Security check 1: Environment validation
    if (process.env.NODE_ENV === "production") {
      console.warn("[dev:tasks:reset] Attempted access in production mode");
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "This endpoint is only available in development mode.",
        },
        { status: 403 }
      );
    }

    // Security check 2: API Key validation
    const adminKey = request.headers.get("x-admin-key");

    if (!adminKey) {
      console.warn("[dev:tasks:reset] Missing x-admin-key header");
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Missing x-admin-key header.",
        },
        { status: 401 }
      );
    }

    if (adminKey !== DEV_ADMIN_KEY) {
      console.warn("[dev:tasks:reset] Invalid admin key provided");
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid admin key.",
        },
        { status: 401 }
      );
    }

    console.log("[dev:tasks:reset] Starting reset operation...");

    // Use admin client to bypass RLS
    const adminClient = getSupabaseAdminClient();

    // Execute full reset
    const result = await fullReset(adminClient);

    console.log("[dev:tasks:reset] Reset completed successfully", result);

    return NextResponse.json(
      {
        success: true,
        message:
          "Tasks, child assignments, and GGPoints have been fully reset for development testing.",
        deleted_child_tasks: result.deletedChildTasks,
        cleared_points: result.clearedPoints,
        deleted_ledger_entries: result.deletedLedgerEntries,
        deleted_custom_tasks: result.deletedCustomTasks,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof DevError) {
      console.error("[dev:tasks:reset] DevError", {
        code: error.code,
        message: error.message,
      });

      let status = 500;
      if (error.code === "FORBIDDEN") status = 403;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    console.error("[dev:tasks:reset] Unexpected error", error);
    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to reset tasks module",
      },
      { status: 500 }
    );
  }
}

