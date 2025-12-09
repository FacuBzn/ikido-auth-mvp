import { createBrowserClient } from "@/lib/supabaseClient";
import type { Child } from "@/store/useSessionStore";
import type { Database } from "@/types/supabase";
import { normalizeName, normalizeCode, type ChildProfile } from "@/lib/types/profiles";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

/**
 * Gets all children for a parent
 * Returns children with normalized data
 */
export const getChildrenByParent = async (
  parentId: string
): Promise<Child[]> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, parent_id, name, child_code, family_code, points_balance, created_at")
    .eq("role", "child")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((child) => {
    const childRow = child as UserRow;
    return {
      id: childRow.id,
      parent_id: childRow.parent_id || "",
      name: childRow.name || "",
      child_code: childRow.child_code || undefined,
      created_at: childRow.created_at,
    };
  });
};

/**
 * Gets a child by ID
 */
export const getChildById = async (
  childId: string
): Promise<ChildProfile | null> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", childId)
    .eq("role", "child")
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const childRow = data as UserRow;
  return {
    id: childRow.id,
    parent_id: childRow.parent_id || "",
    name: childRow.name || "",
    family_code: childRow.family_code || "",
    child_code: childRow.child_code || null,
    points_balance: childRow.points_balance || 0,
    created_at: childRow.created_at,
  };
};
