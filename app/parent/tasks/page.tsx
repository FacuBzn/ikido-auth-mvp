import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Create Tasks | iKidO (GGPoints)",
};

export default function ParentTasksPage() {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {() => (
        <main className="screen-shell text-white">
          <div className="screen-card w-full max-w-md space-y-8 px-8 py-10">
            <header className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Create Tasks</h1>
              <p className="text-sm text-white/75">
                This page is under construction. Task creation functionality will be available soon.
              </p>
            </header>
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}

