import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { LoginForm } from "../login/LoginForm";

export const metadata: Metadata = {
  title: "Child Login | iKidO (GGPoints)",
};

export default async function ChildLoginPage() {
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    if (authUser.profile.role === "Child") {
      redirect(getDashboardPathByRole(authUser.profile.role));
    } else {
      redirect("/parent/dashboard");
    }
  }

  return (
    <main className="screen-shell">
      <div className="screen-card w-full max-w-md p-8 text-white">
        <div className="screen-card__inner">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">iKidO</h1>
            <p className="text-xl font-semibold text-[var(--brand-gold-400)]">Welcome back, Cadet!</p>
            <p className="text-sm text-white/75">
              Sign in to view your missions, track your GGPoints, and unlock amazing rewards.
            </p>
          </header>

          <div className="rounded-3xl bg-[#0d3a5c]/70 p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.7)]">
            <LoginForm />
          </div>

          <footer className="text-center text-xs text-white/65">
            Secure Supabase authentication with child dashboard.
          </footer>
        </div>
      </div>
    </main>
  );
}

