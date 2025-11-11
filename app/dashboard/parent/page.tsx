import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChildrenSummaryModal } from "./ChildrenSummaryModal";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO (GGPoints)",
};

export default function ParentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {({ profile }) => (
        <main className="screen-shell text-white">
          <div className="screen-card w-full max-w-md space-y-8 px-8 py-10">
            <header className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">iKidO</h1>
              <p className="text-lg font-semibold text-[var(--brand-gold-400)]">
                Hello, {profile.name ?? profile.email.split("@")[0] ?? "parent"}
              </p>
              <p className="text-sm text-white/75">
                Manage your crew, approve missions, and keep the rewards radar glowing.
              </p>
            </header>

            <div className="space-y-3">
              <Button
                asChild
                className="ikido-button ikido-button--pill justify-between text-base"
              >
                <Link href="/dashboard/parent/children">Manage Children</Link>
              </Button>
              <Button
                className="ikido-button ikido-button--pill justify-between text-base"
                disabled
              >
                Export Weekly Report
              </Button>
              <Button
                className="ikido-button ikido-button--pill justify-between text-base"
                disabled
              >
                Create Tasks
              </Button>
              <Button
                className="ikido-button ikido-button--pill justify-between text-base"
                disabled
              >
                Rewards
              </Button>
              <Button
                className="ikido-button ikido-button--pill justify-between text-base"
                disabled
              >
                History
              </Button>
            </div>

            <section className="space-y-3 rounded-3xl bg-[#0d3a5c]/80 p-5 shadow-inner">
              <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-gold-200)]">
                <span>Your children</span>
                <ChildrenSummaryModal parentId={profile.id} />
              </div>
              <Card className="border-none bg-[#0b2f4c] px-4 py-4 text-sm text-white">
                <CardContent className="p-0 text-center text-white/70">
                  Connect Supabase data to display the active crew.
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}

