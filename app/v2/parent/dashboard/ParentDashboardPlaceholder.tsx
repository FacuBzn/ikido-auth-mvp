"use client";

import { useRouter } from "next/navigation";
import { PanelCard, IkidoLogo, PrimaryButton } from "@/components/ikido";
import { LogOut, Check } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

interface Props {
  parentName: string;
  familyCode: string;
}

/**
 * Placeholder dashboard for V2 Parent
 * Will be replaced with full implementation in PR4
 */
export function ParentDashboardPlaceholder({ parentName, familyCode }: Props) {
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/v2/parent/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Empty space for alignment */}
        <div className="w-[88px]" />

        {/* Logo */}
        <IkidoLogo />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <PanelCard className="space-y-6">
            {/* Welcome */}
            <div>
              <h1 className="text-xl font-black text-[var(--ik-accent-yellow)] mb-2">
                Welcome, {parentName}!
              </h1>
              <p className="text-[var(--ik-text-muted)] text-sm">
                Manage chores and rewards together
              </p>
            </div>

            {/* Family Code */}
            <div className="bg-[var(--ik-surface-1)] rounded-xl p-4">
              <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                Your Family Code
              </p>
              <div className="text-3xl font-black text-[var(--ik-accent-yellow)] mb-2">
                {familyCode || "N/A"}
              </div>
              <div className="flex items-center justify-center gap-2 text-[var(--ik-success)] text-sm">
                <Check className="w-4 h-4" />
                <span>Share this with your children</span>
              </div>
            </div>

            {/* Placeholder Notice */}
            <div className="bg-[var(--ik-surface-2)] rounded-xl p-4">
              <p className="text-[var(--ik-accent-cyan)] font-bold text-sm mb-1">
                🚧 Dashboard Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-xs">
                This is a placeholder. Full dashboard will be implemented in
                PR4.
              </p>
            </div>

            {/* Link to current dashboard */}
            <PrimaryButton
              onClick={() => router.push("/parent/dashboard")}
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
