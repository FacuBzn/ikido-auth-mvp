import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { ParentDashboardClient } from "./ParentDashboardClient";
import type { Child, Parent } from "@/store/useSessionStore";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO",
};

/**
 * V2 Parent Dashboard Page
 * Server-side auth check and data fetching
 * Uses same pattern as current /parent/dashboard
 */
export default async function V2ParentDashboardPage() {
  const supabase = await createSupabaseServerComponentClient();

  // Use getUser() for secure authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/parent/login");
  }

  // Get parent from users table
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select("id, auth_id, name, email, family_code, created_at")
    .eq("auth_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (parentError || !parentData) {
    redirect("/parent/login");
  }

  // Get children for this parent
  const { data: childrenData, error: childrenError } = await supabase
    .from("users")
    .select("id, parent_id, name, child_code, family_code, points_balance, created_at")
    .eq("role", "child")
    .eq("parent_id", parentData.id)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("[V2 ParentDashboard] Failed to load children:", childrenError);
  }

  // Map to Parent type
  const parent: Parent = {
    id: parentData.id,
    auth_user_id: parentData.auth_id || user.id,
    full_name: parentData.name || "",
    email: parentData.email || user.email || "",
    family_code: parentData.family_code || "",
    created_at: parentData.created_at,
  };

  // Map to Child[] type
  const children: Child[] = (childrenData || []).map((child) => ({
    id: child.id,
    parent_id: child.parent_id || parent.id,
    name: child.name || "",
    child_code: child.child_code || undefined,
    family_code: child.family_code || undefined,
    points_balance: child.points_balance || 0,
    created_at: child.created_at,
  }));

  return (
    <ParentDashboardClient
      parent={parent}
      initialChildren={children}
    />
  );
}
