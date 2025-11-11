import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChildDashboardClient } from "./ChildDashboardClient";

export const metadata: Metadata = {
  title: "Child Dashboard | iKidO (GGPoints)",
};

export default function ChildDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["Child"]}>
      {({ profile }) => <ChildDashboardClient profile={profile} />}
    </ProtectedRoute>
  );
}

