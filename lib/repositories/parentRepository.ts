import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import { generateFamilyCode } from "@/lib/generateFamilyCode";
import type { Parent, Child } from "@/store/useSessionStore";

// This file uses Supabase. For mock fallback, see lib/repositories/mock/parentRepository.mock.ts

/**
 * Generates a unique family code by checking against the database
 */
const generateUniqueFamilyCode = async (
  supabase: SupabaseClient
): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateFamilyCode();
    const { data, error } = await supabase
      .from("parents")
      .select("family_code")
      .eq("family_code", code)
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

  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Failed to create user account");
  }

  const authUserId = authData.user.id;

  // Step 2: Generate unique family code
  const familyCode = await generateUniqueFamilyCode(supabase);

  // Step 3: Insert parent record
  const { data: parentData, error: parentError } = await supabase
    .from("parents")
    .insert({
      auth_user_id: authUserId,
      full_name: fullName,
      email,
      family_code: familyCode,
    })
    .select()
    .single();

  if (parentError) {
    throw new Error(parentError.message);
  }

  if (!parentData) {
    throw new Error("Failed to create parent record");
  }

  const parentRecord = parentData as {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    family_code: string;
    created_at: string;
  };

  return {
    id: parentRecord.id,
    auth_user_id: parentRecord.auth_user_id,
    full_name: parentRecord.full_name,
    email: parentRecord.email,
    family_code: parentRecord.family_code,
    created_at: parentRecord.created_at,
  };
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
}): Promise<{ parent: Parent; session: any }> => {
  const supabase = createBrowserClient();

  // Step 1: Sign in with Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user || !authData.session) {
    throw new Error("Failed to sign in");
  }

  const authUserId = authData.user.id;

  // Step 2: Get parent record
  const { data: parentData, error: parentError } = await supabase
    .from("parents")
    .select()
    .eq("auth_user_id", authUserId)
    .single();

  if (parentError) {
    throw new Error(parentError.message);
  }

  if (!parentData) {
    throw new Error("Parent record not found");
  }

  const parentRecord = parentData as {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    family_code: string;
    created_at: string;
  };

  return {
    parent: {
      id: parentRecord.id,
      auth_user_id: parentRecord.auth_user_id,
      full_name: parentRecord.full_name,
      email: parentRecord.email,
      family_code: parentRecord.family_code,
      created_at: parentRecord.created_at,
    },
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

  const { data, error } = await supabase
    .from("parents")
    .select()
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const parentRecord = data as {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    family_code: string;
    created_at: string;
  };

  return {
    id: parentRecord.id,
    auth_user_id: parentRecord.auth_user_id,
    full_name: parentRecord.full_name,
    email: parentRecord.email,
    family_code: parentRecord.family_code,
    created_at: parentRecord.created_at,
  };
};

/**
 * Gets a parent by family code
 */
export const getParentByFamilyCode = async (
  familyCode: string
): Promise<Parent | null> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("parents")
    .select()
    .eq("family_code", familyCode.toUpperCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const parentRecord = data as {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    family_code: string;
    created_at: string;
  };

  return {
    id: parentRecord.id,
    auth_user_id: parentRecord.auth_user_id,
    full_name: parentRecord.full_name,
    email: parentRecord.email,
    family_code: parentRecord.family_code,
    created_at: parentRecord.created_at,
  };
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

