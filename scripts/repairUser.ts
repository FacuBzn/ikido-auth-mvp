/**
 * DEV-ONLY utility to repair the alignment between Supabase Auth and public.users.
 *
 * Usage:
 *    npx tsx scripts/repairUser.ts <email> <password>
 *
 * The script:
 * 1. Logs into Supabase Auth using the provided email/password (Anon key).
 * 2. Uses the Service Role key to ensure the `public.users` profile exists.
 * 3. Creates the profile with a fresh family code if it is missing.
 *
 * ⚠️ Requires the following env vars:
 *    NEXT_PUBLIC_SUPABASE_URL
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    SUPABASE_SERVICE_ROLE_KEY  (dev only, never expose to the client!)
 */

import { createClient } from "@supabase/supabase-js";
import { generateFamilyCode } from "@/lib/generateFamilyCode";
import type { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const [emailArg, passwordArg] = process.argv.slice(2);

if (!emailArg || !passwordArg) {
  console.error("Usage: npx tsx scripts/repairUser.ts <email> <password>");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;

const publicClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const generateUniqueFamilyCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateFamilyCode();
    const { data } = await serviceClient
      .from("users")
      .select("id")
      .eq("child_code", code)
      .eq("role", "parent")
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique family code after several attempts.");
};

const main = async () => {
  console.log(`🔐 Logging into Supabase Auth with ${email} ...`);
  const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    throw new Error(authError?.message || "Invalid credentials");
  }

  const authUser = authData.user;
  console.log(`✅ Auth user found: ${authUser.id}`);

  const { data: profile, error: profileError } = await serviceClient
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .eq("role", "parent")
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    throw new Error(profileError.message);
  }

  if (profile) {
    console.log("🎉 Profile already exists in public.users. No action required.");
    return;
  }

  const familyCode = await generateUniqueFamilyCode();
  const { error: insertError } = await serviceClient.from("users").insert({
    id: authUser.id,
    auth_id: authUser.id,
    email: authUser.email ?? email,
    name: (authUser.user_metadata?.full_name as string | undefined) ?? authUser.email ?? "Parent",
    role: "parent",
    child_code: familyCode,
    points_balance: 0,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  console.log("✅ Profile repaired successfully with family code:", familyCode);
};

main().catch((error) => {
  console.error("Repair script failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

