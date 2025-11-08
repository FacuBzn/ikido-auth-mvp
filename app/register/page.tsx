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
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
        <RegisterForm />
      </div>
    </main>
  );
}

