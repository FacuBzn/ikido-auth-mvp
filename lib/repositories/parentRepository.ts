import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import { generateFamilyCode } from "@/lib/generateFamilyCode";
import type { Parent } from "@/store/useSessionStore";
import { normalizeName, normalizeCode } from "@/lib/types/profiles";

// This file uses Supabase. For mock fallback, see lib/repositories/mock/parentRepository.mock.ts

type ParentTableRow = {
  id: string;
  auth_id: string;
  name: string | null;
  email: string;
  family_code: string | null;
  created_at: string;
};

/**
 * Generates a unique family code by checking against the database
 * Uses users table with role='parent' and family_code field
 * Returns UPPERCASE code
 */
const generateUniqueFamilyCode = async (
  supabase: SupabaseClient
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = normalizeCode(generateFamilyCode());
    const { data, error } = await supabase
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

  throw new Error(
    "Failed to generate unique family code after multiple attempts"
  );
};

const mapParent = (parentRecord: ParentTableRow, fallbackCode?: string): Parent => ({
  id: parentRecord.id,
  auth_user_id: parentRecord.auth_id,
  full_name: parentRecord.name || "",
  email: parentRecord.email,
  family_code: parentRecord.family_code || fallbackCode || "",
  created_at: parentRecord.created_at,
});

const waitForAuthUser = async (
  supabase: SupabaseClient,
  authUserId: string,
  maxAttempts = 6,
  delayMs = 400
): Promise<User> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("[parentRepository] getUser attempt failed", {
        attempt,
        message: error.message,
      });
    }

    if (data?.user?.id === authUserId) {
      return data.user;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    "Authentication session not ready yet. Please verify your email confirmation and try again."
  );
};

/**
 * Inserts parent profile into users table
 * Normalizes name to INITCAP and family_code to UPPERCASE
 */
const insertParentProfile = async ({
  supabase,
  authUserId,
  email,
  fullName,
  familyCode,
}: {
  supabase: SupabaseClient;
  authUserId: string;
  email: string;
  fullName: string;
  familyCode?: string;
}): Promise<ParentTableRow> => {
  let code = familyCode ? normalizeCode(familyCode) : (await generateUniqueFamilyCode(supabase));
  let retries = 3;

  while (retries > 0) {
    // Normalize name to INITCAP
    const normalizedName = normalizeName(fullName);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = normalizeCode(code); // Ensure UPPERCASE

    // Validate family_code is not empty
    if (!normalizedCode || normalizedCode.trim().length === 0) {
      throw new Error("Failed to generate valid family code");
    }

    const payload = {
      id: authUserId,
      auth_id: authUserId,
      email: normalizedEmail,
      name: normalizedName,
      role: "parent" as const,
      family_code: normalizedCode, // UPPERCASE - MUST be set at registration, NOT NULL
      parent_auth_id: null, // Parents don't have parent_auth_id
      child_code: null, // Parents don't have child_code
      points_balance: 0,
    };

    console.log("[parentRepository] Inserting parent profile:", {
      id: payload.id,
      auth_id: payload.auth_id,
      role: payload.role,
      family_code: payload.family_code,
      email: payload.email,
    });

    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      console.log("[parentRepository] Parent profile inserted successfully:", {
        id: data.id,
        family_code: data.family_code,
      });
      return data as ParentTableRow;
    }

    if (error?.code === "23505") {
      console.warn("[parentRepository] Duplicate family_code detected, regenerating...");
      code = await generateUniqueFamilyCode(supabase);
      retries -= 1;
      continue;
    }

    if (error?.code === "42501") {
      console.warn("[parentRepository] RLS blocked insert, retrying...", { retriesRemaining: retries - 1 });
      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (retries === 0) {
        throw new Error(
          "Permission denied while saving your profile. Please reload the page and try again."
        );
      }
      continue;
    }

    throw new Error(
      `Database error saving new user: ${error?.message ?? "Unknown error"}${
        error?.hint ? ` (${error.hint})` : ""
      }`
    );
  }

  throw new Error("Failed to save the profile after multiple attempts. Please try again.");
};

const fetchParentRow = async (
  supabase: SupabaseClient,
  authUserId: string
): Promise<ParentTableRow | null> => {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("auth_id", authUserId)
    .eq("role", "parent")
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    if (error.message.includes("Could not find the table")) {
      console.warn("[parentRepository] public.users table missing or schema mismatch", error.message);
      return null;
    }

    throw new Error(error.message);
  }

  return (data as ParentTableRow) ?? null;
};

/**
 * Registers a new parent user
 * Normalizes email to lowercase, name to INITCAP, family_code to UPPERCASE
 */
export const registerParent = async ({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}): Promise<Parent> => {
  const supabase = createBrowserClient();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  // Validate password requirements
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Step 1: Create user in Supabase Auth
  const normalizedName = normalizeName(fullName);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: normalizedName,
      },
    },
  });

  if (authError) {
    const errorCode = (authError as { code?: string }).code;
    const errorMessage = authError.message || "Unknown error";
    
    console.error("[parentRepository] Supabase signup error details:", {
      message: errorMessage,
      code: errorCode,
      status: authError.status,
      name: authError.name,
    });

    if (errorCode === "unexpected_failure") {
      throw new Error(
        "Database error during account creation. This may be caused by a database trigger or function. Please check your Supabase database configuration or contact support."
      );
    }

    if (authError.status === 500) {
      if (errorCode === "unexpected_failure" || errorMessage.includes("Database error")) {
        throw new Error(
          "Database error during account creation. A database trigger or function may be failing. Please check your Supabase database logs or contact support."
        );
      }
      throw new Error(
        "Authentication service is temporarily unavailable. Please try again in a few moments. If the problem persists, contact support."
      );
    }

    if (errorMessage.includes("already registered") || 
        errorMessage.includes("already exists") ||
        errorMessage.includes("User already registered")) {
      throw new Error("This email is already registered. Please sign in instead.");
    }
    
    if (errorMessage.includes("password") || errorMessage.includes("Password")) {
      throw new Error("Password does not meet requirements. Please use at least 6 characters.");
    }
    
    if (errorMessage.includes("email") || errorMessage.includes("Email")) {
      throw new Error("Invalid email address. Please check and try again.");
    }

    if (authError.status === 422) {
      throw new Error(
        errorMessage || 
        "Invalid registration data. Please check your email and password format."
      );
    }

    const finalMessage = errorCode 
      ? `${errorMessage} (Code: ${errorCode}${authError.status ? `, Status: ${authError.status}` : ""})`
      : errorMessage;
    throw new Error(
      authError.status 
        ? `${finalMessage} (Error ${authError.status})`
        : finalMessage
    );
  }

  if (!authData.user) {
    throw new Error("Failed to create user account");
  }

  const authUserId = authData.user.id;

  // Step 2: Confirm Supabase Auth session is ready
  await waitForAuthUser(supabase, authUserId);

  // Step 3: Generate unique family code (UPPERCASE)
  const familyCode = await generateUniqueFamilyCode(supabase);

  // Step 4: Insert the profile row (will retry internally on conflicts)
  const parentRecord = await insertParentProfile({
    supabase,
    authUserId,
    email: normalizedEmail,
    fullName,
    familyCode,
  });

  return mapParent(parentRecord, familyCode);
};

/**
 * Logs in a parent user
 */
export const loginParent = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ parent: Parent; session: Session }> => {
  const supabase = createBrowserClient();

  const normalizedEmail = email.trim().toLowerCase();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError) {
    console.error("[parentRepository] Supabase login error details:", {
      message: authError.message,
      status: authError.status,
      name: authError.name,
    });

    if (authError.status === 500) {
      throw new Error(
        "Authentication service is temporarily unavailable. Please try again in a few moments. If the problem persists, contact support."
      );
    }

    if (authError.message?.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password. Please check your credentials and try again.");
    }
    
    const errorMessage = authError.message || "Unable to sign in at this time.";
    throw new Error(
      authError.status 
        ? `${errorMessage} (Error ${authError.status})`
        : errorMessage
    );
  }

  if (!authData.user || !authData.session) {
    throw new Error("Failed to sign in. Please try again.");
  }

  const authUserId = authData.user.id;
  let parentRow = await fetchParentRow(supabase, authUserId);

  if (!parentRow) {
    console.warn("[parentRepository] Missing parent profile, attempting to repair automatically.", {
      authUserId,
    });

    const fallbackName =
      (authData.user.user_metadata?.full_name as string | undefined) ??
      authData.user.email ??
      "Parent";

    // Generate family_code when repairing profile
    const familyCode = await generateUniqueFamilyCode(supabase);

    parentRow = await insertParentProfile({
      supabase,
      authUserId,
      email: authData.user.email ?? normalizedEmail,
      fullName: fallbackName,
      familyCode, // Explicitly generate family_code
    });
  }

  return {
    parent: mapParent(parentRow),
    session: authData.session,
  };
};

/**
 * Gets a parent by auth user ID
 */
export const getParentByAuthUserId = async (
  authUserId: string
): Promise<Parent | null> => {
  const supabase = createBrowserClient();
  const parentRow = await fetchParentRow(supabase, authUserId);
  return parentRow ? mapParent(parentRow) : null;
};

/**
 * Gets a parent by family code
 * Normalizes input to UPPERCASE
 */
export const getParentByFamilyCode = async (
  familyCode: string
): Promise<Parent | null> => {
  const supabase = createBrowserClient();
  const normalizedCode = normalizeCode(familyCode);

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("role", "parent")
    .eq("family_code", normalizedCode)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    if (error.message.includes("Could not find the table")) {
      console.warn("Table 'users' may not exist or schema is different:", error.message);
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapParent(data as ParentTableRow);
};
