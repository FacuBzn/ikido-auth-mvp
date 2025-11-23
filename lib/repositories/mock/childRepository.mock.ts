import { getParentByFamilyCode, createChild } from "./parentRepository.mock";
import type { Parent, Child } from "@/store/useSessionStore";

const STORAGE_KEY_CHILDREN = "ikido_mock_children";

const loadChildren = (): Child[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY_CHILDREN);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Joins a child to a family using family code (mock)
 */
export const joinChild = async ({
  familyCode,
  childName,
}: {
  familyCode: string;
  childName: string;
}): Promise<{ child: Child; parent: Parent }> => {
  const parent = await getParentByFamilyCode(familyCode);

  if (!parent) {
    throw new Error("Invalid family code");
  }

  const children = loadChildren();
  const existingChild = children.find(
    (c) => c.parent_id === parent.id && c.name.toLowerCase() === childName.trim().toLowerCase()
  );

  let child: Child;

  if (existingChild) {
    child = existingChild;
  } else {
    child = await createChild({
      parentId: parent.id,
      childName: childName.trim(),
    });
  }

  return { child, parent };
};

/**
 * Gets all children for a parent (mock)
 */
export const getChildrenByParent = async (parentId: string): Promise<Child[]> => {
  const children = loadChildren();
  return children.filter((c) => c.parent_id === parentId);
};

