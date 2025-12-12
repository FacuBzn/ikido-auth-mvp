"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/useSessionStore";
import { createBrowserClient } from "@/lib/supabaseClient";

export const Header = () => {
  const parent = useSessionStore((state) => state.parent);
  const child = useSessionStore((state) => state.child);
  const logout = useSessionStore((state) => state.logout);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandHref = useMemo(() => {
    if (parent) {
      return "/parent/dashboard";
    }
    if (child) {
      return "/child/dashboard";
    }
    return "/";
  }, [parent, child]);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setError(null);

    try {
      // If there's a parent, sign out from Supabase Auth
      if (parent) {
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
      }
      
      // Logout from store (clears both parent and child)
      await logout();
      
      router.push("/");
      // No need for refresh - navigation will handle it
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Failed to sign out.");
      setIsSigningOut(false);
      return;
    }

    setIsSigningOut(false);
  };

  const hasSession = parent || child;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center px-4 py-6" style={{ height: 'var(--header-height)' }}>
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

        {hasSession ? (
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
