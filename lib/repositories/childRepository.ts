import { createBrowserClient } from "@/lib/supabaseClient";
import { getParentByFamilyCode, createChild } from "./parentRepository";
import type { Parent, Child } from "@/store/useSessionStore";

// This file uses Supabase. For mock fallback, see lib/repositories/mock/childRepository.mock.ts

/**
 * Joins a child to a family using family code
 * If child doesn't exist, creates it
 */
export const joinChild = async ({
  familyCode,
  childName,
}: {
  familyCode: string;
  childName: string;
}): Promise<{ child: Child; parent: Parent }> => {
  // Step 1: Find parent by family code
  const parent = await getParentByFamilyCode(familyCode);

  if (!parent) {
    throw new Error("Invalid family code");
  }

  const supabase = createBrowserClient();

  // Step 2: Check if child already exists
  const { data: existingChild, error: findError } = await supabase
    .from("children")
    .select()
    .eq("parent_id", parent.id)
    .eq("name", childName.trim())
    .maybeSingle();

  if (findError && findError.code !== "PGRST116") {
    throw new Error(findError.message);
  }

  let child: Child;

  if (existingChild) {
    // Child exists, return it
    const childData = existingChild as {
      id: string;
      parent_id: string;
      name: string;
      created_at: string;
    };
    child = {
      id: childData.id,
      parent_id: childData.parent_id,
      name: childData.name,
      created_at: childData.created_at,
    };
  } else {
    // Child doesn't exist, create it
    child = await createChild({
      parentId: parent.id,
      childName: childName.trim(),
    });
  }

  return { child, parent };
};

/**
 * Gets all children for a parent
 */
export const getChildrenByParent = async (
  parentId: string
): Promise<Child[]> => {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("children")
    .select()
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((child) => {
    const childData = child as {
      id: string;
      parent_id: string;
      name: string;
      created_at: string;
    };
    return {
      id: childData.id,
      parent_id: childData.parent_id,
      name: childData.name,
      created_at: childData.created_at,
    };
  });
};

