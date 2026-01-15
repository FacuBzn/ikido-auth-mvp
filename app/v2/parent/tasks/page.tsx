import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { PanelCard, IkidoLogo, SecondaryButton } from "@/components/ikido";
import { ArrowLeft, CheckSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Manage Tasks | iKidO",
};

/**
 * V2 Parent Tasks Page - Placeholder
 * Will be fully implemented in a future PR
 */
export default async function V2ParentTasksPage() {
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
            Manage Tasks
          </h1>

          <PanelCard className="space-y-6">
            <div className="py-8">
              <CheckSquare className="w-16 h-16 text-[var(--ik-accent-cyan)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--ik-accent-cyan)] font-bold text-lg mb-2">
                Coming Soon
              </p>
              <p className="text-[var(--ik-text-muted)] text-sm">
                V2 task management will be implemented in a future PR.
              </p>
            </div>

            <Link href="/parent/tasks">
              <SecondaryButton fullWidth>
                Use Current Tasks (V1)
              </SecondaryButton>
            </Link>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
