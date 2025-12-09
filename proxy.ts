import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_ROUTE_BY_ROLE } from "@/lib/authRoutes";
import { createMiddlewareClient } from "@/lib/supabase/serverClient";
import {
  fromDatabaseUserRole,
  isUserRole,
  type UserRole,
} from "@/types/supabase";

export async function proxy(req: NextRequest) {
  const { supabase, response } = createMiddlewareClient(req);
  const [
    { data: sessionResult },
    { data: userResult, error: userError },
  ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

  if (userError) {
    console.error("[proxy] Failed to validate user", userError);
  }

  const session = sessionResult.session;
  const user = userResult.user ?? null;

  const { pathname } = req.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!user && isDashboardRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!session || !user) {
    return response;
  }

  const metadataRole = user.user_metadata?.role;
  let resolvedRole: UserRole | null = isUserRole(metadataRole)
    ? metadataRole
    : fromDatabaseUserRole(metadataRole);

  if (!resolvedRole) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const databaseRole = fromDatabaseUserRole(profile.role);
      if (databaseRole) {
        resolvedRole = databaseRole;
      }
    }
  }

  if (!resolvedRole) {
    return response;
  }

  if (isAuthRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = DASHBOARD_ROUTE_BY_ROLE[resolvedRole];
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  if (isDashboardRoute) {
    const allowedPath = DASHBOARD_ROUTE_BY_ROLE[resolvedRole];
    if (!pathname.startsWith(allowedPath)) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = allowedPath;
      redirectUrl.searchParams.delete("redirectTo");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*"],
};


