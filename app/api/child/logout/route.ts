/**
 * POST /api/child/logout
 * 
 * Logs out the child by clearing the session cookie
 * Requires: Child session cookie (optional - will clear even if invalid)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearChildSession } from "@/lib/auth/childSession";

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Child logged out successfully",
    });

    // Clear child session cookie
    clearChildSession(response);

    return response;
  } catch (error) {
    console.error("[api:child:logout] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

