import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/serverClient";
import { getChildrenByParent } from "@/lib/repositories/childRepository";
import { ParentDashboardClient } from "./ParentDashboardClient";
import type { Child } from "@/store/useSessionStore";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO",
};

export default async function ParentDashboardPage() {
  const supabase = await createServerClient();
  
  // Use getUser() instead of getSession() for secure authentication
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
    .select()
    .eq("auth_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (parentError || !parentData) {
    redirect("/parent/login");
  }

  // Map users table structure to Parent type
  const parentRecord = parentData as {
    id: string;
    auth_id: string;
    name: string | null;
    email: string;
    family_code?: string | null; // Family code for parent
    created_at: string;
  };

  // Get children
  let children: Child[] = [];
  try {
    children = await getChildrenByParent(parentRecord.id);
  } catch (error) {
    console.error("Failed to load children:", error);
  }

  const parent = {
    id: parentRecord.id,
    auth_user_id: parentRecord.auth_id,
    full_name: parentRecord.name || "",
    email: parentRecord.email,
    family_code: parentRecord.family_code || "", // Use family_code field
    created_at: parentRecord.created_at,
  };

  return (
    <ParentDashboardClient parent={parent} initialChildren={children} />
  );
}
