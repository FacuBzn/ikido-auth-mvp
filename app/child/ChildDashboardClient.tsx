"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore, type SessionProfile } from "@/store/useSessionStore";
import { useToast } from "@/hooks/use-toast";
import { getLoginPathByRole } from "@/lib/authRoutes";

type ChildDashboardClientProps = {
  profile: SessionProfile;
};

export const ChildDashboardClient = ({ profile }: ChildDashboardClientProps) => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const resetSession = useSessionStore((state) => state.reset);
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error && error.message !== "Auth session missing!") {
        throw error;
      }

      resetSession();
      toast({
        title: "Signed out",
        description: "Come back soon for more missions!",
      });
      router.push(getLoginPathByRole(profile.role));
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "We could not sign you out right now. Please try again.";
      toast({
        variant: "destructive",
        title: "Sign-out failed",
        description: message,
      });
      setIsSigningOut(false);
    }
  };

  const greeting = profile.name ?? profile.email;

  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#1A5FA0] via-[#0F4C7D] to-[#0B2647] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,211,105,0.18),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(26,95,160,0.35),_transparent_45%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-4">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <span className="text-sm uppercase tracking-[0.4em] text-yellow-200/80">
              Cadet dashboard
            </span>
            <Button
              variant="ghost"
              className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing out…
                </>
              ) : (
                <>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight">
              Hey {greeting ? greeting.split("@")[0] : "Champion"}! ✨
            </h1>
            <p className="mx-auto max-w-2xl text-white/80 md:mx-0">
              Your missions, points, and rewards live here. Complete tasks, earn GGPoints, and unlock
              special treats from your crew.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-white/10 bg-white/10 backdrop-blur">
            <CardContent className="space-y-5 px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Today&apos;s missions</h2>
                <span className="rounded-full bg-yellow-300/90 px-4 py-1 text-sm font-semibold text-[#0F4C7D]">
                  3 tasks
                </span>
              </div>
              <div className="grid gap-3 text-sm text-white/90">
                {[
                  { title: "Tidy your room", points: "+150 GGPoints" },
                  { title: "Help set the dinner table", points: "+120 GGPoints" },
                  { title: "Practice piano 20 minutes", points: "+180 GGPoints" },
                ].map((task) => (
                  <div key={task.title} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-base font-semibold">{task.title}</p>
                    <p className="text-white/70">{task.points}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs uppercase tracking-wide text-white/60">
                Tip: Hook this list to your Supabase `tasks` table and filter by status.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/15 bg-gradient-to-br from-yellow-200/90 via-yellow-300/90 to-orange-300/90 text-[#0F4C7D] shadow-xl">
              <CardContent className="space-y-3 px-6 py-6">
                <h2 className="text-xl font-semibold">Current streak</h2>
                <p className="text-4xl font-bold">6 days 🔥</p>
                <p className="text-sm text-[#0F4C7D]/80">
                  Keep the momentum! Complete all missions today to push your streak even higher.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

