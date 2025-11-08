import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_ROUTE_BY_ROLE } from "@/lib/authRoutes";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/serverClient";
import type { UserRole } from "@/types/supabase";

const isUserRole = (role: unknown): role is UserRole =>
  role === "Parent" || role === "Child";

export async function middleware(req: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!session && isDashboardRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!session) {
    return response;
  }

  const metadataRole = session.user.user_metadata?.role;
  let resolvedRole: UserRole | null = isUserRole(metadataRole) ? metadataRole : null;

  if (!resolvedRole) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile && isUserRole(profile.role)) {
      resolvedRole = profile.role;
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

