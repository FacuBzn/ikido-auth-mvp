import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServerClient";
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

  // Get parent from parents table
  const { data: parentData, error: parentError } = await supabase
    .from("parents")
    .select()
    .eq("auth_user_id", session.user.id)
    .single();

  if (parentError || !parentData) {
    redirect("/parent/login");
  }

  // Type assertion for parentData
  const parentRecord = parentData as {
    id: string;
    auth_user_id: string;
    full_name: string;
    email: string;
    family_code: string;
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
    auth_user_id: parentRecord.auth_user_id,
    full_name: parentRecord.full_name,
    email: parentRecord.email,
    family_code: parentRecord.family_code,
    created_at: parentRecord.created_at,
  };

  return (
    <ParentDashboardClient parent={parent} initialChildren={children} />
  );
}
