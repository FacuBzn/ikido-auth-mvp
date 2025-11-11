"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { cn } from "@/lib/utils";
import { selectProfile, selectSession, useSessionStore } from "@/store/useSessionStore";

export const Header = () => {
  const session = useSessionStore(selectSession);
  const profile = useSessionStore(selectProfile);
  const resetSession = useSessionStore((state) => state.reset);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandHref = useMemo(() => {
    if (!session) {
      return "/";
    }

    if (profile?.role) {
      return getDashboardPathByRole(profile.role);
    }

    return "/dashboard/parent";
  }, [profile?.role, session]);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let message = "Failed to sign out.";
        try {
          const body = (await response.json()) as { error?: string };
          if (body?.error) {
            message = body.error;
          }
        } catch {
          // ignore JSON parsing errors
        }
        throw new Error(message);
      }
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Failed to sign out.");
      setIsSigningOut(false);
      return;
    }

    resetSession();
    router.push("/login");
    router.refresh();
    setIsSigningOut(false);
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 py-6">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <Link
          href={brandHref}
          className="pointer-events-auto inline-flex items-center gap-3 rounded-full bg-[#0d3a5c]/70 px-4 py-2 text-white shadow-[0_12px_24px_-18px_rgba(0,0,0,0.6)] backdrop-blur"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand-gold-400)] text-[var(--brand-blue-900)]">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-[0.3em] uppercase">iKidO</span>
        </Link>

        {session ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
              "pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#0d3a5c]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_14px_28px_-20px_rgba(0,0,0,0.7)] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold-400)]",
              isSigningOut && "opacity-70"
            )}
          >
            <LogOut className="size-4" />
            {isSigningOut ? "Signing out…" : "Logout"}
          </button>
        ) : null}
      </div>
      {error && (
        <div className="pointer-events-auto absolute inset-x-4 top-[4.5rem] rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-center text-xs text-red-100 backdrop-blur">
          {error}
        </div>
      )}
    </header>
  );
};

