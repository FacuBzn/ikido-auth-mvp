import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/serverClient";

const isSessionMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as { message?: string; status?: number };
  return authError.message === "Auth session missing!" || authError.status === 400;
};

const mergeCookies = (source: NextResponse, target: NextResponse) => {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
};

export async function POST(request: NextRequest) {
    const { supabase, response } = createRouteHandlerClient(request);

  try {
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    const user = userResult?.user ?? null;

    if (userError && !isSessionMissingError(userError)) {
      console.error("[auth:signout] Failed to read user before sign out", userError);
      const errorResponse = NextResponse.json(
        { success: false, error: "Failed to read current user" },
        { status: 500 }
      );
      mergeCookies(response, errorResponse);
      return errorResponse;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
    if (signOutError && !isSessionMissingError(signOutError)) {
      console.error("[auth:signout] Failed to sign out user", signOutError);
      const errorResponse = NextResponse.json(
        { success: false, error: "Failed to sign out user" },
        { status: 500 }
      );
      mergeCookies(response, errorResponse);
      return errorResponse;
    }

    if (signOutError && isSessionMissingError(signOutError)) {
      console.warn("[auth:signout] Session already missing while signing out");
    }

    console.log(
      "[auth:signout] User signed out successfully",
      user?.id ?? "anonymous",
      new Date().toISOString()
    );

    const successResponse = NextResponse.json({ success: true }, { status: 200 });
    mergeCookies(response, successResponse);
    return successResponse;
  } catch (error) {
    console.error("[auth:signout] Unexpected error", error);
    const errorResponse = NextResponse.json(
      { success: false, error: "Unexpected error while signing out" },
      { status: 500 }
    );
    mergeCookies(response, errorResponse);
    return errorResponse;
  }
}

