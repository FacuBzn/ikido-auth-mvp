import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServerClient";
import { ChildDashboardClient } from "./ChildDashboardClient";

export const metadata: Metadata = {
  title: "Child Dashboard | iKidO",
};

export default async function ChildDashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // For child, we don't use Supabase Auth, so we check the session store on client side
  // This is a server component that will redirect if needed
  return <ChildDashboardClient />;
}
