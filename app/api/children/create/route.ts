import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { normalizeName, normalizeCode } from "@/lib/types/profiles";

type CreateChildRequest = {
  name: string;
};

/**
 * Generates a unique child_code in the format NAME#NUMBER
 * Example: GERONIMO#3842
 * ALWAYS returns uppercase to ensure consistency
 */
const generateChildCode = (name: string, randomSuffix: number): string => {
  const normalizedName = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 10) || "CHILD";
  return `${normalizedName}#${randomSuffix}`;
};

/**
 * POST /api/children/create
 * 
 * Creates a new child record in the users table.
 * Children do NOT have Supabase Auth accounts.
 * 
 * Inserts:
 * {
 *   id: uuid,
 *   auth_id: null,
 *   role: "child",
 *   name: normalizedName (INITCAP),
 *   parent_id: parent.id,
 *   family_code: parent.family_code,
 *   child_code: generatedCode (UPPERCASE),
 *   points_balance: 0
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authenticated user is a Parent
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      console.warn("[api:children:create] No authenticated user found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("[api:children:create] Authenticated user:", {
      id: authUser.profile.id,
      role: authUser.profile.role,
    });

    if (authUser.profile.role !== "Parent") {
      console.warn("[api:children:create] User is not a parent:", authUser.profile.role);
      return NextResponse.json(
        { message: "Only parents can create children accounts" },
        { status: 403 }
      );
    }

    const body: CreateChildRequest = await request.json();
    const { name } = body;

    // Normalize name to INITCAP
    const normalizedName = normalizeName(name);

    if (!normalizedName) {
      return NextResponse.json({ message: "Child name is required" }, { status: 400 });
    }

    const { supabase } = createRouteHandlerClient(request);

    // Get authenticated user's auth.uid() for parent_auth_id
    const { data: { user: authUserData }, error: authUserError } = await supabase.auth.getUser();
    
    if (authUserError || !authUserData) {
      console.error("[api:children:create] Failed to get auth user:", authUserError);
      return NextResponse.json(
        { message: "Failed to verify authentication" },
        { status: 401 }
      );
    }

    const parentAuthId = authUserData.id;

    // Load parent row from database to get parent.id and family_code
    const { data: parentRow, error: parentError } = await supabase
      .from("users")
      .select("id, family_code")
      .eq("auth_id", parentAuthId)
      .eq("role", "parent")
      .maybeSingle();

    if (parentError || !parentRow) {
      console.error("[api:children:create] Failed to load parent:", parentError);
      return NextResponse.json(
        { message: "Failed to load parent information" },
        { status: 500 }
      );
    }

    if (!parentRow.family_code) {
      console.error("[api:children:create] Parent missing family_code");
      return NextResponse.json(
        { message: "Parent account is missing family code" },
        { status: 500 }
      );
    }

    console.log("[api:children:create] Parent loaded:", { 
      parent_id: parentRow.id,
      parent_auth_id: parentAuthId,
      family_code: parentRow.family_code,
    });

    // Generate unique child_code
    let finalChildCode: string | null = null;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidateCode = generateChildCode(normalizedName, randomSuffix);
      const normalizedCandidateCode = normalizeCode(candidateCode);

      // Check if child_code already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("child_code", normalizedCandidateCode)
        .maybeSingle();

      if (!existing) {
        finalChildCode = normalizedCandidateCode;
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !finalChildCode) {
      return NextResponse.json(
        { message: "Failed to generate unique child code. Please try again." },
        { status: 500 }
      );
    }

    // Generate UUID for child
    const childId = randomUUID();

    // Prepare insert payload with all required fields
    const insertPayload = {
      id: childId,
      auth_id: null, // Children do NOT have Auth users
      parent_id: parentRow.id, // Internal FK to parent's users.id
      parent_auth_id: parentAuthId, // auth.uid() of the parent (for RLS)
      role: "child" as const,
      name: normalizedName, // INITCAP normalized
      family_code: normalizeCode(parentRow.family_code), // Parent's family_code, normalized
      child_code: finalChildCode, // Generated code, UPPERCASE
      points_balance: 0,
      email: null, // Children do not have email
    };

    console.log("[api:children:create] Inserting child:", {
      id: insertPayload.id,
      name: insertPayload.name,
      parent_id: insertPayload.parent_id,
      family_code: insertPayload.family_code,
      child_code: insertPayload.child_code,
    });

    // Insert child record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert(insertPayload as any)
      .select("id, name, child_code, parent_id, family_code, points_balance, created_at")
      .maybeSingle();

    if (userError) {
      console.error("[api:children:create] INSERT FAILED:", {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
      });
      return NextResponse.json(
        {
          message: `Failed to create child record: ${userError.message}`,
        },
        { status: 500 }
      );
    }

    if (!userData) {
      console.error("[api:children:create] No data returned after insert");
      return NextResponse.json(
        { message: "User record was not created successfully" },
        { status: 500 }
      );
    }

    console.log("[api:children:create] SUCCESS - Child created:", {
      id: userData.id,
      name: userData.name,
      child_code: userData.child_code,
      parent_id: userData.parent_id,
      family_code: userData.family_code,
    });

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      child_code: userData.child_code,
      parent_id: userData.parent_id,
      family_code: userData.family_code,
      points_balance: userData.points_balance,
      created_at: userData.created_at,
    });
  } catch (error) {
    console.error("[api:children:create] Unexpected error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while creating the child account" },
      { status: 500 }
    );
  }
}
