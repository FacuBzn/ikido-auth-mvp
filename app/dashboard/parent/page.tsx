import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO (GGPoints)",
};

export default function ParentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {({ profile }) => (
        <main className="flex flex-1 flex-col gap-6 px-6 py-12">
          <header className="flex flex-col gap-2">
            <span className="text-sm uppercase tracking-wide text-slate-400">
              Welcome back
            </span>
            <h1 className="text-3xl font-semibold text-white">
              {profile.name ?? profile.email}
            </h1>
            <p className="text-slate-300">
              Monitor household progress, reward redemptions, and assign new missions to your crew.
            </p>
          </header>
          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Children overview</h2>
              <p className="mt-2 text-sm text-slate-300">
                Connect to Supabase to render assigned tasks, completed missions, and reward usage.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">Upcoming rewards</h2>
              <p className="mt-2 text-sm text-slate-300">
                Surface available rewards and highlight those close to redemption to keep motivation high.
              </p>
            </article>
          </section>
        </main>
      )}
    </ProtectedRoute>
  );
}

