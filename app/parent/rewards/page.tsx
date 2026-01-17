import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { getServerSession } from "@/lib/authHelpers";
import { ParentRewardsClient } from "./ParentRewardsClient";

export const metadata: Metadata = {
  title: "Manage Rewards | iKidO",
};

export const dynamic = "force-dynamic";

type ChildForSelector = {
  id: string;
  name: string;
  points_balance: number;
};

export default async function V2ParentRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
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
    .select("id, name, points_balance")
    .eq("parent_id", parentData.id)
    .eq("role", "child")
    .order("name", { ascending: true });

  const childrenList: ChildForSelector[] = (childrenData || []).map((c) => ({
    id: c.id,
    name: c.name || "Unknown",
    points_balance: c.points_balance ?? 0,
  }));

  // Get initial child from query params
  const params = await searchParams;
  const initialChildId = params.childId || childrenList[0]?.id || "";

  return (
    <ParentRewardsClient
      childrenList={childrenList}
      initialChildId={initialChildId}
    />
  );
}
