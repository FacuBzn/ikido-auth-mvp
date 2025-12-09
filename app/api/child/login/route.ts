import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { normalizeName, normalizeCode } from "@/lib/types/profiles";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

type ChildLoginRequest = {
  child_code: string;
  family_code: string;
  name?: string; // Optional - if not provided, uses name from DB
};

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createSupabaseRouteHandlerClient(request);

    // Block child login if parent session is active
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.json(
        {
          error: "PARENT_LOGGED_IN",
          message: "A parent is logged in. Please log out before entering child mode.",
        },
        { status: 400 }
      );
    }

    const body: ChildLoginRequest = await request.json();
    const { child_code, family_code, name } = body;

    // Validate required inputs
    if (!child_code || !child_code.trim()) {
      return NextResponse.json(
        { error: "INVALID_CHILD_CODE", message: "Child code is required" },
        { status: 400 }
      );
    }

    if (!family_code || !family_code.trim()) {
      return NextResponse.json(
        { error: "INVALID_FAMILY_CODE", message: "Family code is required" },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedChildCode = normalizeCode(child_code);
    const normalizedFamilyCode = normalizeCode(family_code);
    const normalizedName = name && name.trim() ? normalizeName(name) : null;

    console.log("[api:child:login] Inputs normalized:", {
      child_code: normalizedChildCode,
      family_code: normalizedFamilyCode,
      name: normalizedName || "not provided",
    });

    // Step 1: Validate parent exists by family_code
    // normalizedFamilyCode already has trim() and toUpperCase() from normalizeCode()
    const searchFamilyCode = normalizedFamilyCode.trim();
    console.log("[api:child:login] Searching parent with family_code:", searchFamilyCode);
    
    const { data: parentData, error: parentError } = await supabase
      .from("users")
      .select("id, family_code")
      .eq("role", "parent")
      .eq("family_code", searchFamilyCode)
      .maybeSingle();

    if (parentError) {
      console.error("[api:child:login] Database error searching parent:", parentError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to validate family code" },
        { status: 500 }
      );
    }

    if (!parentData) {
      // Debug: Check if RLS is blocking or parent doesn't exist
      const { data: debugParents, error: debugError } = await supabase
        .from("users")
        .select("id, family_code, role")
        .eq("role", "parent")
        .limit(5);
      
      console.warn("[api:child:login] Invalid family_code - parent not found:", {
        searched: searchFamilyCode,
        rls_error: debugError?.message,
        available_parents: debugParents?.map(p => ({ id: p.id, family_code: p.family_code })),
        note: "If available_parents is empty, RLS may be blocking. Check policy 'Child login can read parent by family_code'",
      });
      
      return NextResponse.json(
        { error: "INVALID_FAMILY_CODE", message: "Invalid family code" },
        { status: 400 }
      );
    }

    // Validate parent has family_code
    if (!parentData.family_code || parentData.family_code.trim() === "") {
      console.error("[api:child:login] Parent found but family_code is NULL or empty:", {
        parent_id: parentData.id,
        family_code: parentData.family_code,
      });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Parent account is missing family code. Please contact support." },
        { status: 500 }
      );
    }

    console.log("[api:child:login] Parent found:", {
      parent_id: parentData.id,
      family_code: parentData.family_code,
    });

    // Step 2: Find child by child_code + family_code
    const searchChildCode = normalizedChildCode.trim();
    console.log("[api:child:login] Searching child with:", { child_code: searchChildCode, family_code: searchFamilyCode });
    
    let childQuery = supabase
      .from("users")
      .select("*")
      .eq("role", "child")
      .eq("child_code", searchChildCode)
      .eq("family_code", searchFamilyCode);

    // Step 3: Optional name validation
    if (normalizedName) {
      childQuery = childQuery.eq("name", normalizedName);
    }

    const { data: childData, error: childError } = await childQuery.maybeSingle();

    if (childError) {
      console.error("[api:child:login] Database error searching child:", childError);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to validate child code" },
        { status: 500 }
      );
    }

    if (!childData) {
      // Debug: Check if RLS is blocking or child doesn't exist
      const { data: debugChildren, error: debugChildError } = await supabase
        .from("users")
        .select("id, child_code, family_code, role")
        .eq("role", "child")
        .limit(5);
      
      console.warn("[api:child:login] Child not found:", {
        searched_child_code: searchChildCode,
        searched_family_code: searchFamilyCode,
        name_provided: !!normalizedName,
        rls_error: debugChildError?.message,
        available_children: debugChildren?.map(c => ({ id: c.id, child_code: c.child_code, family_code: c.family_code })),
        note: "If available_children is empty, RLS may be blocking. Check policy for child login",
      });
      
      return NextResponse.json(
        { error: "INVALID_CHILD_CODE", message: "Invalid child code" },
        { status: 400 }
      );
    }

    const child = childData as UserRow;

    console.log("[api:child:login] SUCCESS - Child authenticated:", {
      child_id: child.id,
      child_name: child.name,
      child_code: child.child_code,
      family_code: child.family_code,
      parent_id: child.parent_id,
    });

    // Return success with child + parent data
    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        parent_id: child.parent_id || "",
        name: child.name || "",
        child_code: child.child_code || "",
        family_code: child.family_code || normalizedFamilyCode,
        points_balance: child.points_balance || 0,
        created_at: child.created_at,
      },
      parent: {
        id: parentData.id,
        family_code: parentData.family_code || normalizedFamilyCode,
        name: null,
      },
    });
  } catch (error) {
    console.error("[api:child:login] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
