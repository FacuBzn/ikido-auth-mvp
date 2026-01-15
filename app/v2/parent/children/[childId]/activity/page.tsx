import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { PanelCard, IkidoLogo, SecondaryButton } from "@/components/ikido";
import { ArrowLeft, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Child Activity | iKidO",
};

interface PageProps {
  params: Promise<{ childId: string }>;
}

/**
 * V2 Child Activity Page - Placeholder
 * Shows activity history for a specific child
 */
export default async function V2ChildActivityPage({ params }: PageProps) {
  const { childId } = await params;
  
  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    redirect("/v2/parent/login");
  }

  if (authUser.profile.role !== "Parent") {
    redirect("/v2/child/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/v2/parent/dashboard"
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </Link>

        <IkidoLogo />

        <div className="w-[88px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-black text-[var(--ik-accent-yellow)] mb-6">
            Child Activity
          </h1>

          <PanelCard className="space-y-6">
            <div className="py-8">
              <Activity className="w-16 h-16 text-[var(--ik-accent-cyan)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--ik-accent-cyan)] font-bold text-lg mb-2">
                Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-sm mb-4">
                Activity history for this child will be available in a future PR.
              </p>
              <p className="text-[var(--ik-text-muted)] text-xs font-mono">
                Child ID: {childId}
              </p>
            </div>

            <Link href="/v2/parent/dashboard">
              <SecondaryButton fullWidth>
                Back to Dashboard
              </SecondaryButton>
            </Link>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
