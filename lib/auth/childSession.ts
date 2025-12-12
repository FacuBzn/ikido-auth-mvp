/**
 * CHILD SESSION MANAGEMENT
 * 
 * Handles child authentication via httpOnly cookies.
 * Children don't use Supabase Auth - they authenticate via child_code only.
 * 
 * Session cookie contains:
 * - child_id: UUID from users table
 * - parent_id: UUID from users table (parent)
 * - family_code: string (for validation)
 * - role: 'child'
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "ikido-child-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Get JWT secret from environment (use a strong secret in production)
const getJWTSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_URL || "fallback-secret-key-change-in-production";
  return new TextEncoder().encode(secret);
};

export interface ChildSession {
  child_id: string;
  parent_id: string;
  family_code: string;
  role: "child";
}

/**
 * Create a child session cookie
 */
export async function createChildSession(
  session: ChildSession,
  response: NextResponse
): Promise<void> {
  const secret = getJWTSecret();
  
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(secret);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Read child session from request cookies
 * Returns null if session is invalid or missing
 */
export async function getChildSession(
  request: NextRequest
): Promise<ChildSession | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);
    
    // Validate payload structure
    if (
      typeof payload.child_id === "string" &&
      typeof payload.parent_id === "string" &&
      typeof payload.family_code === "string" &&
      payload.role === "child"
    ) {
      return {
        child_id: payload.child_id,
        parent_id: payload.parent_id,
        family_code: payload.family_code,
        role: "child",
      };
    }

    return null;
  } catch (error) {
    console.error("[childSession] Failed to verify session token:", error);
    return null;
  }
}

/**
 * Clear child session cookie
 */
export function clearChildSession(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}

/**
 * Require child session - throws error if session is missing
 * Use this in API routes that require child authentication
 */
export async function requireChildSession(
  request: NextRequest
): Promise<ChildSession> {
  const session = await getChildSession(request);

  if (!session) {
    throw new Error("UNAUTHORIZED: Child session required");
  }

  return session;
}

