/**
 * Converts a child_code (e.g., "GERONIMO#3842") to a synthetic email
 * format used for Supabase Auth (e.g., "GERONIMO-3842@child.ikido")
 */
export const childCodeToEmail = (childCode: string): string => {
  const normalized = childCode.trim().toUpperCase();
  const email = normalized.replace("#", "-") + "@child.ikido";
  return email.toLowerCase();
};

/**
 * Validates if a string matches the child_code format (NAME#NUMBER)
 */
export const isValidChildCodeFormat = (code: string): boolean => {
  const pattern = /^[A-Z0-9]+#[0-9]+$/i;
  return pattern.test(code.trim());
};




