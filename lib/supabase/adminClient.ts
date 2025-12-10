import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Creates or returns a singleton Supabase client using the SERVICE_ROLE key.
 * 
 * This client MUST only be used on the server side in trusted contexts
 * (e.g., API routes for child endpoints that don't use Supabase Auth).
 * 
 * The SERVICE_ROLE key bypasses Row Level Security (RLS), so use with caution.
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {SupabaseClient<Database>} Singleton admin client instance
 */
export const getSupabaseAdminClient = (): SupabaseClient<Database> => {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables for admin client. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined on the server."
    );
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return adminClient;
};

