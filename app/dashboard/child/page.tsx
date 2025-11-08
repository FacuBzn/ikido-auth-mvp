import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Child Dashboard | iKidO (GGPoints)",
};

export default function ChildDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["Child"]}>
      {({ profile }) => (
        <main className="flex flex-1 flex-col gap-6 px-6 py-12">
          <header className="flex flex-col gap-2">
            <span className="text-sm uppercase tracking-wide text-slate-400">
              Hey there
            </span>
            <h1 className="text-3xl font-semibold text-white">
              {profile.name ?? profile.email}
            </h1>
            <p className="text-slate-300">
              Track your missions, earn GGPoints, and unlock rewards that matter to you.
            </p>
          </header>
          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Today&apos;s missions</h2>
              <p className="mt-2 text-sm text-slate-300">
                Once connected to Supabase, you will see your assigned tasks and completion status here.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Rewards tracker</h2>
              <p className="mt-2 text-sm text-slate-300">
                Keep an eye on the rewards you are saving for and celebrate new achievements.
              </p>
            </article>
          </section>
        </main>
      )}
    </ProtectedRoute>
  );
}

