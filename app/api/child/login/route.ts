import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { normalizeCode } from "@/lib/types/profiles";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { createChildSession } from "@/lib/auth/childSession";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

type ChildLoginRequest = {
  child_code: string;
  name?: string; // Optional - if not provided, uses name from DB
};

export async function POST(request: NextRequest) {
  try {
    const body: ChildLoginRequest = await request.json();
    const { child_code } = body;

    // Validate required input
    if (!child_code || !child_code.trim()) {
      return NextResponse.json(
        { error: "INVALID_CHILD_CODE", message: "Child code is required" },
        { status: 400 }
      );
    }

    // Normalize child_code
    const normalizedChildCode = normalizeCode(child_code);

    console.log("[api:child:login] Searching child with child_code:", normalizedChildCode);

    // Use admin client to bypass RLS
    const adminClient = getSupabaseAdminClient();

    // Step 1: Find child by child_code only
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, child_code, family_code, parent_id, name, points_balance, created_at")
      .eq("role", "child")
      .eq("child_code", normalizedChildCode)
      .maybeSingle();

    if (childError) {
      console.error("[api:child:login] Database error searching child:", childError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to validate child code" },
        { status: 500 }
      );
    }

    if (!childData) {
      console.warn("[api:child:login] Child not found:", {
        searched_child_code: normalizedChildCode,
      });
      
      return NextResponse.json(
        { error: "INVALID_CHILD_CODE", message: "Invalid child code" },
        { status: 401 }
      );
    }

    const child = childData as UserRow;

    // Step 2: Resolve parent automatically from child's family_code
    if (!child.family_code || child.family_code.trim() === "") {
      console.error("[api:child:login] Child found but family_code is NULL or empty:", {
        child_id: child.id,
        child_code: child.child_code,
      });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Child account is missing family code. Please contact support." },
        { status: 500 }
      );
    }

    const { data: parentData, error: parentError } = await adminClient
      .from("users")
      .select("id, family_code")
      .eq("role", "parent")
      .eq("family_code", child.family_code)
      .maybeSingle();

    if (parentError) {
      console.error("[api:child:login] Database error searching parent:", parentError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to resolve parent" },
        { status: 500 }
      );
    }

    if (!parentData) {
      console.error("[api:child:login] Parent not found for family_code:", {
        child_id: child.id,
        family_code: child.family_code,
      });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Parent account not found. Please contact support." },
        { status: 500 }
      );
    }

    // Validate parent_id matches
    if (child.parent_id && child.parent_id !== parentData.id) {
      console.warn("[api:child:login] Parent ID mismatch:", {
        child_parent_id: child.parent_id,
        resolved_parent_id: parentData.id,
        family_code: child.family_code,
      });
      // Continue anyway - use resolved parent_id
    }

    const resolvedParentId = child.parent_id || parentData.id;

    console.log("[api:child:login] SUCCESS - Child authenticated:", {
      child_id: child.id,
      child_name: child.name,
      child_code: child.child_code,
      family_code: child.family_code,
      parent_id: resolvedParentId,
    });

    // Step 3: Create child session
    const response = NextResponse.json({
      success: true,
      child: {
        id: child.id,
        parent_id: resolvedParentId,
        name: child.name || "",
        child_code: child.child_code || "",
        family_code: child.family_code,
        points_balance: child.points_balance || 0,
        created_at: child.created_at,
      },
      parent: {
        id: parentData.id,
        family_code: parentData.family_code,
        name: null,
      },
    });

    await createChildSession(
      {
        child_id: child.id,
        parent_id: resolvedParentId,
        family_code: child.family_code,
        role: "child",
      },
      response
    );

    return response;
  } catch (error) {
    console.error("[api:child:login] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
