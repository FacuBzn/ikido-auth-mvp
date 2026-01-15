import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { ParentTasksClient } from "./ParentTasksClient";

export const metadata: Metadata = {
  title: "Manage Tasks | iKidO",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ childId?: string }>;
}

/**
 * Child type for selector
 */
export type ChildForSelector = {
  id: string;
  name: string;
  child_code: string | null;
};

/**
 * V2 Parent Tasks Page
 * Server component that validates auth and fetches children list
 */
export default async function V2ParentTasksPage({ searchParams }: PageProps) {
  const { childId: initialChildId } = await searchParams;

  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    redirect("/v2/parent/login");
  }

  if (authUser.profile.role !== "Parent") {
    redirect("/v2/child/dashboard");
  }

  const supabase = await createSupabaseServerComponentClient();

  // Get parent record
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.user.id)
    .eq("role", "parent")
    .single();

  if (parentError || !parentData) {
    redirect("/v2/parent/login");
  }

  // Get children for selector
  const { data: childrenData, error: childrenError } = await supabase
    .from("users")
    .select("id, name, child_code")
    .eq("role", "child")
    .eq("parent_id", parentData.id)
    .order("name", { ascending: true });

  if (childrenError) {
    console.error("[V2 ParentTasks] Failed to load children:", childrenError);
  }

  const children: ChildForSelector[] = (childrenData || []).map((c) => ({
    id: c.id,
    name: c.name || "Unknown",
    child_code: c.child_code,
  }));

  return (
    <ParentTasksClient
      parentId={parentData.id}
      childrenList={children}
      initialChildId={initialChildId}
    />
  );
}
