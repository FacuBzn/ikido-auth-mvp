/**
 * GET /api/metrics/logins
 * 
 * Returns unique user login metrics for a date range.
 * 
 * Query params:
 * - from (YYYY-MM-DD): Start date (optional, default: 30 days ago)
 * - to (YYYY-MM-DD): End date (optional, default: today)
 * 
 * Auth: Requires parent authentication (Supabase Auth)
 * 
 * Returns:
 * {
 *   range: { from: string, to: string },
 *   unique_users_total: number,
 *   unique_users_by_day: [{ date: string, unique_users: number }],
 *   unique_users_by_role: [{ role: string, unique_users: number }]
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

/**
 * Parse date string (YYYY-MM-DD) to ISO timestamptz at 00:00:00 UTC
 */
function parseDateToISO(dateStr: string): string {
  return `${dateStr}T00:00:00Z`;
}

/**
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);

  return {
    from: from.toISOString().split("T")[0], // YYYY-MM-DD
    to: to.toISOString().split("T")[0], // YYYY-MM-DD
  };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check - require parent authentication
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can access metrics" },
        { status: 403 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let fromDate: string;
    let toDate: string;

    if (fromParam && toParam) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fromParam) || !dateRegex.test(toParam)) {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "Date format must be YYYY-MM-DD" },
          { status: 400 }
        );
      }

      fromDate = fromParam;
      toDate = toParam;
    } else {
      // Use default range (last 30 days)
      const defaultRange = getDefaultDateRange();
      fromDate = defaultRange.from;
      toDate = defaultRange.to;
    }

    // 3. Convert to timestamptz
    const fromISO = parseDateToISO(fromDate);
    // to date should be exclusive (next day 00:00:00)
    const toDateObj = new Date(parseDateToISO(toDate));
    toDateObj.setUTCDate(toDateObj.getUTCDate() + 1);
    const toISO = toDateObj.toISOString();

    console.log("[api:metrics:logins] Fetching metrics", {
      from: fromISO,
      to: toISO,
      parent_id: authUser.profile.id,
    });

    // 4. Call RPC function
    const adminClient = getSupabaseAdminClient();
    const { data, error } = await adminClient.rpc("metrics_unique_logins", {
      from_ts: fromISO,
      to_ts: toISO,
    });

    if (error) {
      console.error("[api:metrics:logins] RPC error:", error);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    // 5. Format response
    const response = {
      range: {
        from: fromDate,
        to: toDate,
      },
      unique_users_total: data?.unique_users_total ?? 0,
      unique_users_by_day: data?.unique_users_by_day ?? [],
      unique_users_by_role: data?.unique_users_by_role ?? [],
    };

    console.log("[api:metrics:logins] Metrics retrieved", {
      unique_users_total: response.unique_users_total,
      days_count: response.unique_users_by_day.length,
      roles_count: response.unique_users_by_role.length,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[api:metrics:logins] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch login metrics" },
      { status: 500 }
    );
  }
}
