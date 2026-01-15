import type { Metadata } from "next";
import { ChildDashboardClient } from "./ChildDashboardClient";

export const metadata: Metadata = {
  title: "Child Dashboard | iKidO",
};

/**
 * V2 Child Dashboard Page
 * No server-side auth for children - uses Zustand store
 * ChildDashboardClient handles auth with useRequireChildAuthV2()
 */
export default function V2ChildDashboardPage() {
  return <ChildDashboardClient />;
}
