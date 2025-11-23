import { generateFamilyCode } from "@/lib/generateFamilyCode";
import type { Parent, Child } from "@/store/useSessionStore";

const STORAGE_KEY_PARENTS = "ikido_mock_parents";
const STORAGE_KEY_CHILDREN = "ikido_mock_children";

const loadParents = (): Parent[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY_PARENTS);
  return stored ? JSON.parse(stored) : [];
};

const saveParents = (parents: Parent[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PARENTS, JSON.stringify(parents));
};

const loadChildren = (): Child[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY_CHILDREN);
  return stored ? JSON.parse(stored) : [];
};

const saveChildren = (children: Child[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(children));
};

/**
 * Generates a unique family code by checking against mock storage
 */
const generateUniqueFamilyCode = (): string => {
  let attempts = 0;
  const maxAttempts = 10;
  const parents = loadParents();

  while (attempts < maxAttempts) {
    const code = generateFamilyCode();
    const exists = parents.some((p) => p.family_code === code);
    if (!exists) {
      return code;
    }
    attempts++;
  }

  throw new Error("Failed to generate unique family code after multiple attempts");
};

/**
 * Registers a new parent user (mock)
 */
export const registerParent = async ({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}): Promise<Parent> => {
  const parents = loadParents();

  // Check if email already exists
  if (parents.some((p) => p.email === email.toLowerCase())) {
    throw new Error("Email already registered");
  }

  const familyCode = generateUniqueFamilyCode();
  const authUserId = `mock_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newParent: Parent = {
    id: `parent_${Date.now()}`,
    auth_user_id: authUserId,
    full_name: fullName,
    email: email.toLowerCase(),
    family_code: familyCode,
    created_at: new Date().toISOString(),
  };

  parents.push(newParent);
  saveParents(parents);

  return newParent;
};

/**
 * Logs in a parent user (mock)
 */
export const loginParent = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ parent: Parent; session: any }> => {
  const parents = loadParents();
  const parent = parents.find((p) => p.email === email.toLowerCase());

  if (!parent) {
    throw new Error("Invalid email or password");
  }

  // Mock session
  const session = {
    access_token: `mock_token_${Date.now()}`,
    refresh_token: `mock_refresh_${Date.now()}`,
    expires_at: Date.now() + 3600000,
  };

  return { parent, session };
};

/**
 * Gets a parent by auth user ID (mock)
 */
export const getParentByAuthUserId = async (
  authUserId: string
): Promise<Parent | null> => {
  const parents = loadParents();
  return parents.find((p) => p.auth_user_id === authUserId) || null;
};

/**
 * Gets a parent by family code (mock)
 */
export const getParentByFamilyCode = async (
  familyCode: string
): Promise<Parent | null> => {
  const parents = loadParents();
  return parents.find((p) => p.family_code === familyCode.toUpperCase()) || null;
};

/**
 * Creates a new child for a parent (mock)
 */
export const createChild = async ({
  parentId,
  childName,
}: {
  parentId: string;
  childName: string;
}): Promise<Child> => {
  const children = loadChildren();

  const newChild: Child = {
    id: `child_${Date.now()}`,
    parent_id: parentId,
    name: childName.trim(),
    created_at: new Date().toISOString(),
  };

  children.push(newChild);
  saveChildren(children);

  return newChild;
};

