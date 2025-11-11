import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { ScreenApp } from "@/components/screens/ScreenApp";

export const metadata: Metadata = {
  title: "iKidO | GGPoints",
};

export default async function Home() {
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    redirect(getDashboardPathByRole(authUser.profile.role));
  }

  return <ScreenApp />;
}
