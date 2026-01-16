/**
 * POST /api/parent/register
 *
 * Registers a new parent user
 * Body: { full_name: string, email: string, password: string }
 *
 * Flow:
 * 1. Validate inputs (email format, password >= 6, full_name not empty)
 * 2. Create user in Supabase Auth using admin client
 * 3. Generate unique family_code
 * 4. Insert row in public.users
 * 5. If users insert fails, rollback by deleting auth user
 *
 * Returns:
 * - 200: { success: true }
 * - 400: { error: "INVALID_INPUT", message }
 * - 409: { error: "EMAIL_ALREADY_EXISTS", message }
 * - 500: { error: "DATABASE_ERROR", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { generateFamilyCode } from "@/lib/generateFamilyCode";
import { normalizeName, normalizeCode } from "@/lib/types/profiles";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[api:parent:register]";

/**
 * Generates a unique family code by checking against the database
 */
async function generateUniqueFamilyCode(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  maxAttempts = 10
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = normalizeCode(generateFamilyCode());
    const { data, error } = await adminClient
      .from("users")
      .select("family_code")
      .eq("role", "parent")
      .eq("family_code", code)
      .maybeSingle();

    if (error && error.code === "PGRST116") {
      return code;
    }

    if (!data) {
      return code;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique family code after multiple attempts");
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate body
    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      password?: string;
    };

    const fullName = body.full_name?.trim();
    const email = body.email?.trim();
    const password = body.password;

    // Validation
    if (!fullName || fullName.length === 0) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 2. Check if email already exists in users table
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS", message: "This email is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // 3. Create user in Supabase Auth using admin client
    const normalizedName = normalizeName(fullName);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm email for V2
      user_metadata: {
        full_name: normalizedName,
      },
    });

    if (authError) {
      console.error(`${LOG_PREFIX} Auth creation error:`, {
        code: authError.code,
        message: authError.message,
        status: authError.status,
      });

      // Handle specific error codes
      if (authError.message?.includes("already") || authError.message?.includes("exists")) {
        return NextResponse.json(
          { error: "EMAIL_ALREADY_EXISTS", message: "This email is already registered. Please sign in instead." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "DATABASE_ERROR", message: authError.message || "Failed to create user account" },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to create user account" },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // 4. Generate unique family code
    let familyCode: string;
    try {
      familyCode = await generateUniqueFamilyCode(adminClient);
    } catch (err) {
      // Rollback: delete auth user if family code generation fails
      console.error(`${LOG_PREFIX} Failed to generate family code, rolling back auth user:`, err);
      await adminClient.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to generate family code. Please try again." },
        { status: 500 }
      );
    }

    // 5. Insert row in public.users
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .insert({
        id: authUserId,
        auth_id: authUserId,
        email: normalizedEmail,
        name: normalizedName,
        role: "parent",
        family_code: familyCode,
        parent_id: null,
        parent_auth_id: null,
        child_code: null,
        points_balance: 0,
      })
      .select()
      .single();

    if (userError || !userData) {
      // Rollback: delete auth user if users insert fails
      console.error(`${LOG_PREFIX} Failed to insert user profile, rolling back auth user:`, userError);
      await adminClient.auth.admin.deleteUser(authUserId);

      if (userError?.code === "23505") {
        // Unique constraint violation (shouldn't happen after email check, but handle it)
        return NextResponse.json(
          { error: "EMAIL_ALREADY_EXISTS", message: "This email is already registered. Please sign in instead." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "DATABASE_ERROR", message: userError?.message || "Failed to create user profile" },
        { status: 500 }
      );
    }

    console.log(`${LOG_PREFIX} Parent registered successfully`, {
      user_id: authUserId,
      email: normalizedEmail,
      family_code: familyCode,
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
