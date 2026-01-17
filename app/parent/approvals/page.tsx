import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { getServerSession } from "@/lib/authHelpers";
import { ApprovalsClient } from "./ApprovalsClient";

export const metadata: Metadata = {
  title: "Approve Tasks | iKidO",
};

export const dynamic = "force-dynamic";

type ChildForSelector = {
  id: string;
  name: string;
};

export default async function V2ParentApprovalsPage() {
  // Server-side auth check
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/parent/login");
  }

  const supabase = await createSupabaseServerComponentClient();

  // Get parent record
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select("id, name")
    .eq("auth_id", session.user.id)
    .eq("role", "parent")
    .single();

  if (parentError || !parentData) {
    redirect("/parent/login");
  }

  // Get children list
  const { data: childrenData } = await supabase
    .from("users")
    .select("id, name")
    .eq("parent_id", parentData.id)
    .eq("role", "child")
    .order("name", { ascending: true });

  const children: ChildForSelector[] = (childrenData || []).map((c) => ({
    id: c.id,
    name: c.name || "Unknown",
  }));

  return <ApprovalsClient childrenList={children} />;
}
