"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PanelCard,
  IkidoLogo,
  SecondaryButton,
  PointsPill,
} from "@/components/ikido";
import { ArrowLeft, Gift } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * V2 Child Rewards Page - Placeholder
 * Will be fully implemented in a future PR
 */
export default function V2ChildRewardsPage() {
  const router = useRouter();
  const child = useSessionStore((state) => state.child);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  // Auth guard - redirect if no child session
  useEffect(() => {
    if (hasHydrated && !child) {
      router.replace("/v2/child/join");
    }
  }, [child, hasHydrated, router]);

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
        <Link
          href="/v2/child/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <PointsPill points={child.points_balance || 0} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] mb-6">
            Rewards Shop
          </h1>

          <PanelCard className="space-y-6">
            <div className="py-8">
              <Gift className="w-16 h-16 text-[var(--ik-accent-cyan)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--ik-accent-cyan)] font-bold text-lg mb-2">
                Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-sm mb-4">
                Spend your GGPoints on awesome rewards!
              </p>
              <div className="bg-[var(--ik-surface-1)] rounded-xl p-4">
                <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                  Your Balance
                </p>
                <p className="text-2xl font-black text-[var(--ik-accent-yellow)]">
                  {child.points_balance || 0} 🪙
                </p>
              </div>
            </div>

            <Link href="/child/rewards">
              <SecondaryButton fullWidth>
                Use Current Rewards (V1)
              </SecondaryButton>
            </Link>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
