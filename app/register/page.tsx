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
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-[#0F4C7D] via-[#1A5FA0] to-[#133A67] px-4 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(15,76,125,0.3),_transparent_45%)]" />
      <div className="relative z-10 w-full max-w-lg">
        <RegisterForm />
      </div>
    </main>
  );
}

