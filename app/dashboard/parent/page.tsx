import type { Metadata } from "next";
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
        <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#0F4C7D] via-[#133A67] to-[#0B2647] px-6 py-16 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_50%),radial-gradient(circle_at_bottom,_rgba(19,58,103,0.4),_transparent_45%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10">
            <header className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <span className="text-sm uppercase tracking-[0.4em] text-white/70">Parent control center</span>
                <h1 className="text-4xl font-bold tracking-tight">
                  Hello, {profile.name ?? profile.email.split("@")[0] ?? "Parent"} 👋
                </h1>
                <p className="max-w-xl text-white/80">
                  Monitor family progress, unlock rewards, and assign new missions to keep the GGPoints momentum alive.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ChildrenSummaryModal parentId={profile.id} />
                <Button className="h-11 rounded-full bg-white/15 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                  Export weekly report
                </Button>
              </div>
            </header>

            <section className="grid gap-6 md:grid-cols-3">
              {[
                { label: "Active Children", value: "3", accent: "from-yellow-300 to-orange-400" },
                { label: "Tasks Completed", value: "12", accent: "from-green-300 to-emerald-500" },
                { label: "Rewards Redeemed", value: "8", accent: "from-sky-300 to-blue-500" },
              ].map((item) => (
                <Card
                  key={item.label}
                  className={`border-0 bg-gradient-to-br ${item.accent} text-slate-900 shadow-xl`}
                >
                  <CardContent className="flex flex-col gap-2 px-6 py-5">
                    <span className="text-sm font-semibold uppercase tracking-wide text-slate-800/80">
                      {item.label}
                    </span>
                    <span className="text-4xl font-bold">{item.value}</span>
                    <p className="text-sm text-slate-900/70">
                      Live metrics powered by your Supabase data (connect collections to hydrate).
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
              <Card className="border-white/15 bg-white/10 backdrop-blur">
                <CardContent className="space-y-4 px-6 py-6">
                  <h2 className="text-xl font-semibold">Mission control</h2>
                  <p className="text-white/80">
                    Assign new chores or missions, adjust point weights, and sync expectations with your crew. Tie this
                    card to a modal or dedicated flow using the task creation UI components.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-white/60">Pending approvals</p>
                      <p className="mt-2 text-2xl font-semibold text-white">4</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-white/60">Weekly streak</p>
                      <p className="mt-2 text-2xl font-semibold text-white">6 days</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="h-11 rounded-full bg-white text-[#0F4C7D] hover:bg-white/90">
                    Create new mission
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/15 bg-white/10 backdrop-blur">
                <CardContent className="space-y-4 px-6 py-6">
                  <h2 className="text-xl font-semibold">Rewards radar</h2>
                  <p className="text-white/80">
                    Highlight rewards within reach to keep everyone motivated. Swap this placeholder with the `RewardCard`
                    grid and hydrate using Supabase reward data.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { name: "Movie Night", cost: "800 GGPoints" },
                      { name: "Ice Cream Trip", cost: "450 GGPoints" },
                    ].map((reward) => (
                      <div key={reward.name} className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm">
                        <p className="text-lg font-semibold text-white">{reward.name}</p>
                        <p className="text-white/70">{reward.cost}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}

