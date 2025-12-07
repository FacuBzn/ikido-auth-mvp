import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";

type CreateChildRequest = {
  name: string;
};

/**
 * Generates a unique child_code in the format NAME#NUMBER
 * Example: GERONIMO#3842
 */
const generateChildCode = (name: string, randomSuffix: number): string => {
  const normalizedName = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 10) || "CHILD";
  return `${normalizedName}#${randomSuffix}`;
};


export async function POST(request: NextRequest) {
  try {
    // Validate authenticated user is a Parent
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { message: "Only parents can create children accounts" },
        { status: 403 }
      );
    }

    const body: CreateChildRequest = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Child name is required" }, { status: 400 });
    }

    const { supabase } = createRouteHandlerClient(request);

    // Load parent row from database to get family_code (child_code of parent)
    const { data: parentRow, error: parentError } = await supabase
      .from("users")
      .select("id, child_code")
      .eq("id", authUser.profile.id)
      .eq("role", "parent")
      .maybeSingle();

    if (parentError || !parentRow) {
      console.error("[api:children:create] Failed to load parent:", parentError);
      return NextResponse.json(
        { message: "Failed to load parent information" },
        { status: 500 }
      );
    }

    if (!parentRow.child_code) {
      return NextResponse.json(
        { message: "Parent does not have a family code. Please contact support." },
        { status: 500 }
      );
    }

    // Generate unique child_code
    let finalChildCode: string | null = null;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      const candidateCode = generateChildCode(name, randomSuffix);

      // Check if child_code already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("child_code", candidateCode)
        .maybeSingle();

      if (!existing) {
        finalChildCode = candidateCode;
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

    // Generate UUID for child (NOT from Auth, just a regular UUID)
    // Children do NOT have Supabase Auth accounts in this MVP
    const childId = randomUUID();

    // Insert child record in users table WITHOUT Auth user
    // Children do NOT have Supabase Auth accounts in this MVP
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: childId,
        auth_id: null, // Children do NOT have Auth users
        email: null, // Children do NOT have email (not used for Auth)
        name: name.trim(),
        role: "child",
        parent_id: parentRow.id,
        family_code: parentRow.child_code, // Use parent's child_code as family_code
        child_code: finalChildCode,
        points_balance: 0,
      } as any) // Type assertion needed because auth_id, email, and family_code may not be in types
      .select("id, name, child_code, created_at")
      .maybeSingle();

    if (userError) {
      console.error("[api:children:create] User creation error:", userError);
      console.error("[api:children:create] Error details:", {
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
      return NextResponse.json(
        { message: "User record was not created successfully" },
        { status: 500 }
      );
    }

    console.log("[api:children:create] Child created successfully:", {
      id: userData.id,
      name: userData.name,
      child_code: userData.child_code,
      parent_id: parentRow.id,
      family_code: parentRow.child_code,
    });

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      child_code: userData.child_code,
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

