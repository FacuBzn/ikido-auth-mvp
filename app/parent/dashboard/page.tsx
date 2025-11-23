import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/serverClient";
import { getChildrenByParent } from "@/lib/repositories/childRepository";
import { createChild } from "@/lib/repositories/parentRepository";
import { ParentDashboardClient } from "./ParentDashboardClient";
import type { Child } from "@/store/useSessionStore";

export const metadata: Metadata = {
  title: "Parent Dashboard | iKidO",
};

export default async function ParentDashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/parent/login");
  }

  // Get parent from users table
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select()
    .eq("auth_id", session.user.id)
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
    child_code?: string | null; // child_code is used as family code for parents
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
    family_code: parentRecord.child_code || "",
    created_at: parentRecord.created_at,
  };

  return (
    <ParentDashboardClient parent={parent} initialChildren={children} />
  );
}
