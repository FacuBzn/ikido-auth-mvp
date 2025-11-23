/**
 * Generates a random 6-character alphanumeric family code
 * Format: A-Z, 0-9 (uppercase)
 */
export const generateFamilyCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Validates that a family code is exactly 6 alphanumeric characters
 */
export const validateFamilyCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
};

