"use client";

import Link from "next/link";
import { PanelCard, PrimaryButton } from "@/components/ikido";
import { Gamepad2, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Client component to show "Continue as Child" if child session exists in Zustand store
 * Handles hydration to avoid SSR mismatch
 */
export function ChildContinueCard() {
  const child = useSessionStore((state) => state.child);
  const hasHydrated = useSessionStore((state) => state._hasHydrated);

  // Don't render anything during SSR or before hydration
  if (!hasHydrated || !child) {
    return null;
  }

  return (
    <PanelCard className="w-full border-2 border-[var(--ik-accent-cyan)]/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-6 h-6 text-[var(--ik-accent-cyan)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--ik-text-muted)] text-xs">Welcome back!</p>
          <p className="font-bold text-white truncate">{child.name}</p>
        </div>
        <Link href="/v2/child/dashboard">
          <PrimaryButton icon={<ArrowRight className="w-4 h-4" />}>
            Continue
          </PrimaryButton>
        </Link>
      </div>
    </PanelCard>
  );
}
