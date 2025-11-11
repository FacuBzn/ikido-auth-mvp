import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/types/supabase";
import { ChildrenManagement } from "./ChildrenManagement";

export const metadata: Metadata = {
  title: "Manage Children | iKidO (GGPoints)",
};

type ChildrenRow = Pick<Database["public"]["Tables"]["children"]["Row"], "id" | "name">;

const ParentChildrenManager = async ({ parentId }: { parentId: string }) => {
  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", parentId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[parent:children] Failed to load children", error);
    throw new Error("We could not load your children list. Please try again.");
  }

  return (
    <ChildrenManagement parentId={parentId} initialChildren={(data ?? []) as ChildrenRow[]} />
  );
};

const ParentChildrenPage = () => {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {({ profile }) => <ParentChildrenManager parentId={profile.id} />}
    </ProtectedRoute>
  );
};

export default ParentChildrenPage;

