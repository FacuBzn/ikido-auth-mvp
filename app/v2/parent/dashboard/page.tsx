import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { ParentDashboardPlaceholder } from "./ParentDashboardPlaceholder";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO",
};

/**
 * V2 Parent Dashboard Page
 * Server-side auth check - redirects to login if not authenticated
 */
export default async function V2ParentDashboardPage() {
  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    redirect("/v2/parent/login");
  }

  if (authUser.profile.role !== "Parent") {
    redirect("/v2/child/dashboard");
  }

  return (
    <ParentDashboardPlaceholder
      parentName={authUser.profile.name || authUser.profile.email}
      familyCode={authUser.profile.family_code || ""}
    />
  );
}
