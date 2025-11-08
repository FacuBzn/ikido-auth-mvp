"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { selectProfile, selectSession, useSessionStore } from "@/store/useSessionStore";

export const Header = () => {
  const session = useSessionStore(selectSession);
  const profile = useSessionStore(selectProfile);
  const resetSession = useSessionStore((state) => state.reset);
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setIsSigningOut(false);
      return;
    }

    resetSession();
    router.push("/login");
    router.refresh();
    setIsSigningOut(false);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/login" className="flex items-center gap-2">
          <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-300">
            iKidO
          </span>
          <span className="hidden text-sm font-medium text-slate-200 sm:inline">
            GGPoints family mission control
          </span>
        </Link>

        {session ? (
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-white">
                {profile?.name ?? profile?.email ?? "User"}
              </span>
              {profile?.role && (
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {profile.role}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={cn(
                "rounded-2xl border border-sky-500/40 px-4 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-400 hover:text-sky-200",
                isSigningOut && "animate-pulse opacity-70"
              )}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link className="text-slate-300 transition hover:text-white" href="/login">
              Login
            </Link>
            <Link
              className="rounded-full bg-sky-500 px-4 py-2 text-slate-950 transition hover:bg-sky-400"
              href="/register"
            >
              Register
            </Link>
          </div>
        )}
      </div>
      {error && (
        <div className="border-t border-red-500/40 bg-red-500/10 px-6 py-3 text-center text-xs text-red-200">
          {error}
        </div>
      )}
    </header>
  );
};

