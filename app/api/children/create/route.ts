import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/serverClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { childCodeToEmail } from "@/lib/childCodeHelpers";
import type { NextRequest } from "next/server";

type CreateChildRequest = {
  name: string;
  password: string;
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
    const { name, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Child name is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteHandlerClient(request);

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
    const syntheticEmail = childCodeToEmail(finalChildCode);

    // TODO: Create auth user requires service role or Edge Function
    // For now, we'll attempt to create via signUp, but this may not work with RLS
    // In production, this should be done via Edge Function with service role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          role: "child",
        },
      },
    });

    if (authError) {
      console.error("[api:children:create] Auth creation error:", authError);
      return NextResponse.json(
        {
          message:
            "Failed to create authentication account. This may require service role access. Please use an Edge Function for production.",
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: "Failed to create authentication user" },
        { status: 500 }
      );
    }

    // Insert user record in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        auth_id: authData.user.id,
        email: syntheticEmail,
        name: name.trim(),
        role: "child",
        parent_id: authUser.profile.id,
        child_code: finalChildCode,
        points_balance: 0,
      })
      .select("id, name, child_code")
      .maybeSingle();

    if (userError) {
      console.error("[api:children:create] User creation error:", userError);
      // Attempt to clean up auth user if possible
      // Note: This may require service role
      return NextResponse.json(
        {
          message: "Failed to create user record. Auth user may have been created but not linked.",
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

    const loginHint = `${finalChildCode} (email: ${syntheticEmail})`;

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      child_code: userData.child_code,
      login_hint: loginHint,
    });
  } catch (error) {
    console.error("[api:children:create] Unexpected error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while creating the child account" },
      { status: 500 }
    );
  }
}

