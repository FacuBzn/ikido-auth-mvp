import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legacy (V1) | iKidO",
};

/**
 * Legacy landing page
 * Provides access to V1 UI while V2 is the default
 */
export default function LegacyPage() {
  return (
    <main className="screen-shell text-white page-content">
      <div className="screen-card w-full max-w-md space-y-8 px-8 py-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--brand-gold-400)] mb-2">
            Legacy Version (V1)
          </h1>
          <p className="text-white/70 text-sm">
            Access the original iKidO interface
          </p>
        </div>

        {/* Parent Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--brand-gold-200)] uppercase tracking-wider">
            Parent
          </h2>
          <div className="space-y-2">
            <Link
              href="/parent/login"
              className="block w-full rounded-full bg-[var(--brand-gold-400)] px-6 py-3 text-center font-semibold text-[var(--brand-blue-700)] hover:bg-[var(--brand-gold-300)] transition-colors"
            >
              Parent Login
            </Link>
            <Link
              href="/parent/dashboard"
              className="block w-full rounded-full border-2 border-[var(--brand-gold-400)] px-6 py-3 text-center font-semibold text-[var(--brand-gold-400)] hover:bg-[var(--brand-gold-400)]/10 transition-colors"
            >
              Parent Dashboard
            </Link>
            <Link
              href="/parent/tasks"
              className="block w-full rounded-full border-2 border-[var(--brand-gold-400)] px-6 py-3 text-center font-semibold text-[var(--brand-gold-400)] hover:bg-[var(--brand-gold-400)]/10 transition-colors"
            >
              Parent Tasks
            </Link>
          </div>
        </section>

        {/* Child Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
            Child
          </h2>
          <div className="space-y-2">
            <Link
              href="/child/join"
              className="block w-full rounded-full bg-cyan-500 px-6 py-3 text-center font-semibold text-white hover:bg-cyan-400 transition-colors"
            >
              Child Join
            </Link>
            <Link
              href="/child/dashboard"
              className="block w-full rounded-full border-2 border-cyan-500 px-6 py-3 text-center font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              Child Dashboard
            </Link>
            <Link
              href="/child/rewards"
              className="block w-full rounded-full border-2 border-cyan-500 px-6 py-3 text-center font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              Child Rewards
            </Link>
          </div>
        </section>

        {/* Back to V2 */}
        <div className="pt-4 border-t border-white/10">
          <Link
            href="/v2"
            className="block w-full rounded-full bg-white/10 px-6 py-3 text-center font-semibold text-white hover:bg-white/20 transition-colors"
          >
            ← Back to V2 (Recommended)
          </Link>
        </div>

        {/* Notice */}
        <p className="text-white/50 text-xs text-center">
          V1 is maintained for compatibility. New features are in V2.
        </p>
      </div>
    </main>
  );
}
