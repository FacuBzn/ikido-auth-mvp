import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "@/lib/authHelpers";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { PanelCard, IkidoLogo, PrimaryButton, CyanButton } from "@/components/ikido";
import { Users, Gamepad2, ArrowRight } from "lucide-react";
import { ChildContinueCard } from "./ChildContinueCard";

export const metadata: Metadata = {
  title: "iKidO | Choose Your Role",
  description: "Select your role to continue",
};

/**
 * V2 Role Selection Page
 * Entry point for V2 UI - allows selecting Parent or Child role
 */
export default async function V2RoleSelectPage() {
  // Check for existing parent session (server-side)
  const session = await getServerSession();
  let parentName: string | null = null;

  if (session?.user) {
    const supabase = await createSupabaseServerComponentClient();
    const { data: parentData } = await supabase
      .from("users")
      .select("name")
      .eq("auth_id", session.user.id)
      .eq("role", "parent")
      .single();

    if (parentData?.name) {
      parentName = parentData.name;
    }
  }

  const hasParentSession = !!parentName;

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-center mb-8 pt-4">
        <IkidoLogo size="large" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-black text-[var(--ik-accent-yellow)] text-center mb-2">
          Choose your role
        </h1>
        <p className="text-[var(--ik-text-muted)] text-center text-sm mb-6">
          Select how you want to use iKidO today
        </p>

        {/* Continue as Parent (if session exists) */}
        {hasParentSession && (
          <PanelCard className="w-full border-2 border-green-500/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--ik-text-muted)] text-xs">
                  Welcome back!
                </p>
                <p className="font-bold text-white truncate">{parentName}</p>
              </div>
              <Link href="/v2/parent/dashboard">
                <PrimaryButton icon={<ArrowRight className="w-4 h-4" />}>
                  Continue
                </PrimaryButton>
              </Link>
            </div>
          </PanelCard>
        )}

        {/* Continue as Child (client-side check) */}
        <ChildContinueCard />

        {/* Divider if any session exists */}
        {hasParentSession && (
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-[var(--ik-outline-light)]" />
            <span className="text-[var(--ik-text-muted)] text-xs">
              or switch role
            </span>
            <div className="flex-1 h-px bg-[var(--ik-outline-light)]" />
          </div>
        )}

        {/* Parent Role Card */}
        <PanelCard className="w-full">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--ik-accent-yellow)]/20 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-[var(--ik-accent-yellow)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white mb-1">Parent</h2>
              <p className="text-[var(--ik-text-muted)] text-sm mb-4">
                Manage tasks, track progress, and reward your children with GGPoints
              </p>
              <Link href="/v2/parent/login" className="block">
                <PrimaryButton fullWidth>
                  Parent Login
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </PanelCard>

        {/* Child Role Card */}
        <PanelCard className="w-full">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--ik-accent-cyan)]/20 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-7 h-7 text-[var(--ik-accent-cyan)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white mb-1">Child</h2>
              <p className="text-[var(--ik-text-muted)] text-sm mb-4">
                Complete tasks, earn GGPoints, and claim awesome rewards!
              </p>
              <Link href="/v2/child/join" className="block">
                <CyanButton fullWidth>
                  Enter Game
                </CyanButton>
              </Link>
            </div>
          </div>
        </PanelCard>

        {/* Footer */}
        <p className="text-[var(--ik-text-muted)] text-xs text-center mt-8">
          iKidO - Making chores fun with GGPoints
        </p>

        {/* Legacy Link */}
        <div className="text-center mt-4">
          <Link
            href="/legacy"
            className="text-[var(--ik-text-muted)] text-xs underline underline-offset-2 hover:text-[var(--ik-accent-cyan)] opacity-60 hover:opacity-100 transition-opacity"
          >
            Use Legacy Version (V1)
          </Link>
        </div>
      </div>
    </div>
  );
}
