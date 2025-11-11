import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login | iKidO (GGPoints)",
};

export default async function LoginPage() {
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    redirect(getDashboardPathByRole(authUser.profile.role));
  }

  return (
    <main className="screen-shell">
      <div className="screen-card w-full max-w-md p-8 text-white">
        <div className="screen-card__inner">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">iKidO</h1>
            <p className="text-xl font-semibold text-[var(--brand-gold-400)]">Welcome back!</p>
            <p className="text-sm text-white/75">
              Sign in to manage missions, approve rewards, and keep the GGPoints adventure alive.
            </p>
          </header>

          <div className="rounded-3xl bg-[#0d3a5c]/70 p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.7)]">
            <LoginForm />
          </div>

          <footer className="text-center text-xs text-white/65">
            Secure Supabase authentication with parent and child dashboards.
          </footer>
        </div>
      </div>
    </main>
  );
}

