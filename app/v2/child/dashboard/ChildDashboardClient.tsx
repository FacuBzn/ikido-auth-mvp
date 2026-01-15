"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PanelCard, IkidoLogo, PrimaryButton, PointsPill } from "@/components/ikido";
import { LogOut, Gamepad2 } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * V2 Child Dashboard Client
 * Uses Zustand for auth - redirects to /v2/child/join if no child session
 */
export function ChildDashboardClient() {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);
  const logout = useSessionStore((state) => state.logout);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  // Auth guard - redirect if no child session
  useEffect(() => {
    if (hasHydrated && !child) {
      router.replace("/v2/child/join");
    }
  }, [child, hasHydrated, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/v2/child/join");
    router.refresh();
  };

  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect in progress or no child
  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--ik-accent-yellow)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--ik-text-muted)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Points Pill */}
        <PointsPill points={child.points_balance || 0} />

        {/* Logo */}
        <IkidoLogo />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>EXIT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <PanelCard className="space-y-6">
            {/* Welcome */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gamepad2 className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
                <span className="text-[var(--ik-text-muted)] text-sm">
                  Hello,
                </span>
              </div>
              <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)]">
                {child.name || "Player"}!
              </h1>
            </div>

            {/* Points Display */}
            <div className="bg-[var(--ik-surface-1)] rounded-xl p-4">
              <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                Your GGPoints
              </p>
              <div className="text-4xl font-black text-[var(--ik-accent-yellow)] mb-1">
                {child.points_balance || 0}
              </div>
              <p className="text-[var(--ik-accent-cyan)] text-xs font-bold">
                🪙 GGPOINTS
              </p>
            </div>

            {/* Child Code Display */}
            <div className="bg-[var(--ik-surface-2)] rounded-xl p-3">
              <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                Your Code
              </p>
              <p className="text-white font-bold text-sm font-mono">
                {child.child_code || "N/A"}
              </p>
            </div>

            {/* Placeholder Notice */}
            <div className="bg-[var(--ik-surface-2)] rounded-xl p-4">
              <p className="text-[var(--ik-accent-cyan)] font-bold text-sm mb-1">
                🚧 Dashboard Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-xs">
                Tasks and rewards will be implemented in PR5.
              </p>
            </div>

            {/* Link to current dashboard */}
            <PrimaryButton
              onClick={() => router.push("/child/dashboard")}
              fullWidth
            >
              Go to Current Dashboard
            </PrimaryButton>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
