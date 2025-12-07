import type { Metadata } from "next";
import { ChildDashboardClient } from "./ChildDashboardClient";

export const metadata: Metadata = {
  title: "Child Dashboard | iKidO",
};

export default async function ChildDashboardPage() {
  // No server-side auth for children
  // ChildDashboardClient handles auth with useRequireChildAuth()
  return <ChildDashboardClient />;
}
