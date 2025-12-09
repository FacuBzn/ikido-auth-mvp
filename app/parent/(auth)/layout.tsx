import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import type { ReactNode } from "react";
import type { Database } from "@/types/supabase";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

/**
 * Layout for authenticated parent routes
 * This layout ONLY applies to routes inside (auth) group
 * Routes like /parent/login and /parent/register are NOT in this group
 */
export default async function AuthenticatedParentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/parent/login");
  }

  // Get parent profile from users table
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select()
    .eq("auth_id", user.id)
    .eq("role", "parent")
    .maybeSingle();

  if (parentError || !parentData) {
    redirect("/parent/login");
  }

  // Type assertion and verify role matches
  const parent = parentData as UserRow;
  if (parent.role !== "parent") {
    redirect("/parent/login");
  }

  return <>{children}</>;
}

