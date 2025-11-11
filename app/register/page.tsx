import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register | iKidO (GGPoints)",
};

export default async function RegisterPage() {
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
            <p className="text-xl font-semibold text-[var(--brand-gold-400)]">Let&apos;s set up your crew</p>
            <p className="text-sm text-white/75">
              Create a parent or child account to start assigning missions and collecting GGPoints.
            </p>
          </header>

          <div className="rounded-3xl bg-[#0d3a5c]/70 p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.7)]">
            <RegisterForm />
          </div>

          <footer className="text-center text-xs text-white/65">
            Each account gets a tailored dashboard with streaks, rewards and family mission control.
          </footer>
        </div>
      </div>
    </main>
  );
}

