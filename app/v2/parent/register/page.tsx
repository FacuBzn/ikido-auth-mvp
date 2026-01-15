import type { Metadata } from "next";
import Link from "next/link";
import { PanelCard, IkidoLogo, SecondaryButton } from "@/components/ikido";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Parent Register | iKidO",
};

/**
 * V2 Parent Register Placeholder
 * Will be fully implemented in a future PR
 */
export default function V2ParentRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* Back Button */}
        <Link
          href="/v2/parent/login"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        {/* Logo */}
        <IkidoLogo />

        {/* Empty space for alignment */}
        <div className="w-[88px]" />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm text-center">
          {/* Title */}
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] text-center mb-6">
            Create Account
          </h1>

          <PanelCard className="space-y-6">
            {/* Placeholder Notice */}
            <div className="py-8">
              <p className="text-6xl mb-4">🚧</p>
              <p className="text-[var(--ik-accent-cyan)] font-bold text-lg mb-2">
                Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-sm">
                V2 registration form will be implemented in a future PR.
              </p>
            </div>

            {/* Back to login */}
            <Link href="/v2/parent/login">
              <SecondaryButton fullWidth>
                Back to Login
              </SecondaryButton>
            </Link>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
