import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

/**
 * Creates a Supabase client for browser/client-side usage
 */
export const createBrowserClient = () => {
  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
