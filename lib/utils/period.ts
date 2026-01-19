/**
 * ISO Week utilities for period-based task occurrences
 * 
 * These functions align with PostgreSQL's ISO week calculation (IYYY-"W"IW format)
 * and use UTC to ensure consistency with database backfill operations.
 */

/**
 * Calculates the ISO week key from a date (format: "YYYY-Www")
 * 
 * Uses ISO 8601 week numbering where:
 * - Week starts on Monday
 * - First week of the year is the week containing Jan 4
 * - Year (IYYY) may differ from calendar year for weeks in Dec/Jan
 * 
 * @param date - Date to calculate week key for (defaults to current date)
 * @returns ISO week key string in format "YYYY-Www" (e.g., "2025-W04")
 * 
 * @example
 * getISOWeekKey(new Date('2025-01-20')) // "2025-W04"
 * getISOWeekKey(new Date('2025-01-06')) // "2025-W02"
 */
export function getISOWeekKey(date: Date = new Date()): string {
  // Get date components in UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Calculate date in UTC
  const utcDate = new Date(Date.UTC(year, month, day));

  // Get ISO week number using UTC date
  const weekNum = getISOWeekNumber(utcDate);
  const isoYear = getISOYear(utcDate);

  // Format as "YYYY-Www" (pad week with leading zero if needed)
  return `${isoYear}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Gets the ISO week number (1-53) for a given date
 * ISO 8601 week starts on Monday and the first week contains Jan 4
 */
function getISOWeekNumber(date: Date): number {
  const year = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // ISO week starts on Monday, so adjust: Monday = 1, Sunday = 0
  const mondayOfJan4 = jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1;
  
  // First Thursday of the year (Jan 4 + offset to get to Thursday)
  const firstThursday = new Date(Date.UTC(year, 0, 4 + (4 - mondayOfJan4)));
  
  // Calculate days since first Thursday
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const daysSinceStart = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const daysSinceFirstThursday = daysSinceStart - 
    Math.floor((firstThursday.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  // Week number = floor(days / 7) + 1
  const weekNum = Math.floor(daysSinceFirstThursday / 7) + 1;
  
  // If negative, it's the last week of previous year
  if (weekNum < 1) {
    const prevYearWeeks = getWeeksInYear(year - 1);
    return prevYearWeeks;
  }
  
  // If beyond weeks in year, it's week 1 of next year
  const weeksInYear = getWeeksInYear(year);
  if (weekNum > weeksInYear) {
    return 1;
  }
  
  return weekNum;
}

/**
 * Gets the ISO year for a given date (may differ from calendar year)
 * The ISO year is the year that contains the Thursday of the week
 */
function getISOYear(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date(Date.UTC(year, month, day)).getUTCDay();
  
  // Adjust to Monday-based (0 = Monday, 6 = Sunday)
  const mondayBased = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Get Thursday of this week
  const thursdayOffset = 3 - mondayBased; // 3 = Thursday
  const thursday = new Date(Date.UTC(year, month, day + thursdayOffset));
  
  return thursday.getUTCFullYear();
}

/**
 * Gets the number of ISO weeks in a given year (52 or 53)
 */
function getWeeksInYear(year: number): number {
  // A year has 53 weeks if Jan 1 is a Thursday or if it's a leap year and Jan 1 is a Wednesday
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOfWeek = jan1.getUTCDay();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  // Adjust to ISO: Monday = 0, Sunday = 6
  const mondayBased = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // 53 weeks if Jan 1 is Thursday (mondayBased = 3) or (leap year and Jan 1 is Wednesday, mondayBased = 2)
  if (mondayBased === 3 || (isLeapYear && mondayBased === 2)) {
    return 53;
  }
  
  return 52;
}

/**
 * Converts an ISO week key to the start date (Monday) of that week in UTC
 * 
 * @param weekKey - ISO week key in format "YYYY-Www" (e.g., "2025-W04")
 * @returns Date object representing Monday 00:00:00 UTC of the week
 * 
 * @example
 * getISOWeekStartDate("2025-W04") // Date representing Monday of week 4 in 2025
 */
export function getISOWeekStartDate(weekKey: string): Date {
  // Parse week key: "YYYY-Www"
  const match = weekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) {
    throw new Error(`Invalid ISO week key format: ${weekKey}. Expected format: "YYYY-Www"`);
  }
  
  const [, yearStr, weekStr] = match;
  const isoYear = parseInt(yearStr, 10);
  const weekNum = parseInt(weekStr, 10);
  
  if (weekNum < 1 || weekNum > 53) {
    throw new Error(`Invalid week number: ${weekNum}. Must be between 1 and 53.`);
  }
  
  // Find Jan 4 of the ISO year (always in week 1 of ISO year)
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();
  
  // Adjust to Monday-based (0 = Monday, 6 = Sunday)
  const mondayOfJan4 = jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1;
  
  // First Thursday of the year
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4 + (4 - mondayOfJan4)));
  
  // Monday of week 1 = firstThursday - 3 days
  const mondayOfWeek1 = new Date(firstThursday);
  mondayOfWeek1.setUTCDate(firstThursday.getUTCDate() - 3);
  
  // Monday of target week = Monday of week 1 + (weekNum - 1) * 7 days
  const mondayOfTargetWeek = new Date(mondayOfWeek1);
  mondayOfTargetWeek.setUTCDate(mondayOfWeek1.getUTCDate() + (weekNum - 1) * 7);
  
  // Set to 00:00:00 UTC
  mondayOfTargetWeek.setUTCHours(0, 0, 0, 0);
  
  return mondayOfTargetWeek;
}

/**
 * Gets the current ISO week key
 * 
 * @returns ISO week key for the current date/time
 */
export function getCurrentISOWeekKey(): string {
  return getISOWeekKey(new Date());
}

/**
 * Alias for getISOWeekKey - maintains API consistency
 * Calculates the ISO week key from a date (format: "YYYY-Www")
 * 
 * @param date - Date to calculate week key for (defaults to current date)
 * @returns ISO week key string in format "YYYY-Www" (e.g., "2025-W04")
 */
export function getCurrentPeriodKey(date: Date = new Date()): string {
  return getISOWeekKey(date);
}

/**
 * Gets the week start date (Monday) in UTC as a date string (YYYY-MM-DD)
 * 
 * @param date - Date to calculate week start for (defaults to current date)
 * @returns Date string in format "YYYY-MM-DD" representing Monday 00:00:00 UTC
 * 
 * @example
 * getWeekStartDateUTC(new Date('2025-01-20')) // "2025-01-20" (if Jan 20 is Monday)
 * getWeekStartDateUTC() // "2025-01-20" (Monday of current week)
 */
export function getWeekStartDateUTC(date: Date = new Date()): string {
  const weekKey = getISOWeekKey(date);
  const mondayDate = getISOWeekStartDate(weekKey);
  
  // Format as YYYY-MM-DD in UTC
  const year = mondayDate.getUTCFullYear();
  const month = String(mondayDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(mondayDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a period key string (validates format)
 * 
 * @param input - Period key string (optional)
 * @returns Normalized period key string or null if invalid
 * 
 * @example
 * normalizePeriodKey("2025-W04") // "2025-W04"
 * normalizePeriodKey("2025-w4") // "2025-W04" (normalized)
 * normalizePeriodKey("invalid") // null
 */
export function normalizePeriodKey(input?: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }
  
  // Match format YYYY-Www (case-insensitive, allow single digit weeks)
  const match = input.trim().match(/^(\d{4})-W(\d{1,2})$/i);
  if (!match) {
    return null;
  }
  
  const [, year, week] = match;
  const weekNum = parseInt(week, 10);
  
  // Validate week range (1-53)
  if (weekNum < 1 || weekNum > 53) {
    return null;
  }
  
  // Normalize to uppercase W and zero-padded week
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}
