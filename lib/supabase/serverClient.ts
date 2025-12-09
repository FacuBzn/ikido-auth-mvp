import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

const normalizeCookies = (entries: { name: string; value: string }[] | null) =>
  entries?.map(({ name, value }) => ({ name, value })) ?? null;

const applyCookies = (
  target:
    | {
        set: (options: { name: string; value: string } & CookieOptions) => void;
      }
    | {
        set: (name: string, value: string, options?: CookieOptions) => void;
      },
  cookiesToSet: { name: string; value: string; options: CookieOptions }[]
) => {
  cookiesToSet.forEach(({ name, value, options }) => {
    try {
      if ("set" in target) {
        if (target.set.length >= 2) {
          (target.set as (name: string, value: string, options?: CookieOptions) => void)(
            name,
            value,
            options
          );
        } else {
          (target.set as (opts: { name: string; value: string } & CookieOptions) => void)({
            name,
            value,
            ...options,
          });
        }
      }
    } catch {
      // Some contexts expose read-only cookies (e.g. Server Components).
    }
  });
};

export const createSupabaseServerComponentClient = async () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => normalizeCookies(cookieStore.getAll()),
      setAll: (cookiesToSet) => applyCookies(cookieStore, cookiesToSet),
    },
  });
};

/**
 * Creates a Supabase client for Server Actions executed via form submissions.
 */
export const createServerActionClient = async (options?: {
  cookieOptions?: CookieOptions;
}) => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => normalizeCookies(cookieStore.getAll()),
      setAll: (cookiesToSet) => applyCookies(cookieStore, cookiesToSet),
    },
    cookieOptions: options?.cookieOptions,
  });
};

export const createSupabaseRouteHandlerClient = (request: NextRequest) => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => normalizeCookies(request.cookies.getAll()),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  return { supabase, response };
};

/**
 * Creates a Supabase client for middleware (app/proxy.ts).
 */
export const createMiddlewareClient = (request: NextRequest) =>
  createRouteHandlerClient(request);
