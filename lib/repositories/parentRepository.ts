import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import { generateFamilyCode } from "@/lib/generateFamilyCode";
import type { Parent, Child } from "@/store/useSessionStore";

// This file uses Supabase. For mock fallback, see lib/repositories/mock/parentRepository.mock.ts

type ParentTableRow = {
  id: string;
  auth_id: string;
  name: string | null;
  email: string;
  child_code: string | null;
  created_at: string;
};

/**
 * Generates a unique family code by checking against the database
 * Uses users table with role='parent' and child_code field (family code)
 */
const generateUniqueFamilyCode = async (
  supabase: SupabaseClient
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateFamilyCode();
    const { data, error } = await supabase
      .from("users")
      .select("child_code")
      .eq("role", "parent")
      .eq("child_code", code)
      .maybeSingle();

    // If no data found (error code PGRST116) or error indicates not found, code is available
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
  family_code: parentRecord.child_code || fallbackCode || "",
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
  let code = familyCode ?? (await generateUniqueFamilyCode(supabase));
  let retries = 3;

  while (retries > 0) {
    const payload = {
      id: authUserId,
      auth_id: authUserId,
      email,
      name: fullName.trim(),
      role: "parent" as const,
      child_code: code,
      points_balance: 0,
    };

    const { data, error } = await supabase
      .from("users")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      return data as ParentTableRow;
    }

    if (error?.code === "23505") {
      console.warn("[parentRepository] Duplicate child_code detected, regenerating...");
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
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (authError) {
    // Extract error code if available (Supabase AuthApiError may have a 'code' property)
    const errorCode = (authError as { code?: string }).code;
    const errorMessage = authError.message || "Unknown error";
    
    // Log the full error for debugging (including all properties)
    const errorDetails = {
      message: errorMessage,
      code: errorCode,
      status: authError.status,
      name: authError.name,
      // Include any additional properties that might exist
      ...(typeof authError === "object" ? authError : {}),
    };
    console.error("[parentRepository] Supabase signup error details:", errorDetails);

    // Handle specific error codes from Supabase Auth
    if (errorCode === "unexpected_failure") {
      // This error typically occurs when a database trigger or function fails during user creation
      throw new Error(
        "Database error during account creation. This may be caused by a database trigger or function. Please check your Supabase database configuration or contact support."
      );
    }

    // Handle 500 Internal Server Error (Supabase Auth server issue)
    if (authError.status === 500) {
      // Check if it's the specific "unexpected_failure" error
      if (errorCode === "unexpected_failure" || errorMessage.includes("Database error")) {
        throw new Error(
          "Database error during account creation. A database trigger or function may be failing. Please check your Supabase database logs or contact support."
        );
      }
      throw new Error(
        "Authentication service is temporarily unavailable. Please try again in a few moments. If the problem persists, contact support."
      );
    }

    // Provide more detailed error messages based on error type
    if (errorMessage.includes("already registered") || 
        errorMessage.includes("already exists") ||
        errorMessage.includes("User already registered")) {
      throw new Error("This email is already registered. Please sign in instead.");
    }
    
    if (errorMessage.includes("password") || 
        errorMessage.includes("Password")) {
      throw new Error("Password does not meet requirements. Please use at least 6 characters.");
    }
    
    if (errorMessage.includes("email") || 
        errorMessage.includes("Email")) {
      throw new Error("Invalid email address. Please check and try again.");
    }

    // For 422 errors, show the specific message from Supabase
    if (authError.status === 422) {
      throw new Error(
        errorMessage || 
        "Invalid registration data. Please check your email and password format."
      );
    }

    // Generic error fallback - include status code and error code if available
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

  // Step 3: Generate unique family code
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

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Log full error details for debugging
    const errorDetails = {
      message: authError.message,
      status: authError.status,
      name: authError.name,
      // Include any additional properties
      ...(typeof authError === "object" ? authError : {}),
    };
    console.error("[parentRepository] Supabase login error details:", errorDetails);

    // Handle 500 Internal Server Error (Supabase Auth server issue)
    if (authError.status === 500) {
      throw new Error(
        "Authentication service is temporarily unavailable. Please try again in a few moments. If the problem persists, contact support."
      );
    }

    if (authError.message?.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password. Please check your credentials and try again.");
    }
    
    // Include status code in error message if available
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

    parentRow = await insertParentProfile({
      supabase,
      authUserId,
      email: authData.user.email ?? email,
      fullName: fallbackName,
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
 */
export const getParentByFamilyCode = async (
  familyCode: string
): Promise<Parent | null> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("role", "parent")
    .eq("child_code", familyCode.toUpperCase())
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    // Don't throw error if table doesn't exist - just return null
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

/**
 * Creates a new child for a parent
 */
export const createChild = async ({
  parentId,
  childName,
}: {
  parentId: string;
  childName: string;
}): Promise<Child> => {
  const supabase = createBrowserClient();

  const { data: childData, error: childError } = await supabase
    .from("children")
    .insert({
      parent_id: parentId,
      name: childName,
    })
    .select()
    .single();

  if (childError) {
    throw new Error(childError.message);
  }

  if (!childData) {
    throw new Error("Failed to create child record");
  }

  const childRecord = childData as {
    id: string;
    parent_id: string;
    name: string;
    created_at: string;
  };

  return {
    id: childRecord.id,
    parent_id: childRecord.parent_id,
    name: childRecord.name,
    created_at: childRecord.created_at,
  };
};

