import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/types/supabase";
import { TasksManagement } from "./TasksManagement";

export const metadata: Metadata = {
  title: "Create Tasks | iKidO (GGPoints)",
};

type ChildUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "child_code"
>;

const ParentTasksManager = async ({ parentId }: { parentId: string }) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, child_code")
    .eq("role", "child")
    .eq("parent_id", parentId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[parent:tasks] Failed to load children", error);
    throw new Error("We could not load your children list. Please try again.");
  }

  return (
    <TasksManagement parentId={parentId} initialChildren={(data ?? []) as ChildUser[]} />
  );
};

export default function ParentTasksPage() {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {({ profile }) => <ParentTasksManager parentId={profile.id} />}
    </ProtectedRoute>
  );
}

