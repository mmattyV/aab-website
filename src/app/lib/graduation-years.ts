/** Month (0-indexed) the classes roll over to the next school year. */
const ACADEMIC_YEAR_START_MONTH = 5; // June

/**
 * Graduation year of the senior class currently in school. From June onward the
 * classes have moved up, so the seniors graduate the following calendar year.
 */
function currentSeniorYear(now: Date): number {
  return now.getMonth() >= ACADEMIC_YEAR_START_MONTH
    ? now.getFullYear() + 1
    : now.getFullYear();
}

/**
 * Graduation years selectable on the signup and profile forms: the four classes
 * currently in school plus the class that graduated most recently, newest class
 * first (e.g. 2030, 2029, 2028, 2027, 2026 during the 2026-27 school year).
 */
export function getValidGraduationYears(now: Date = new Date()): string[] {
  const senior = currentSeniorYear(now);
  const years: string[] = [];
  for (let year = senior + 3; year >= senior - 1; year--) {
    years.push(String(year));
  }
  return years;
}

/**
 * The same list, but guaranteed to contain `selected` so editing a profile whose
 * year has aged out of the range does not silently reassign them to another class.
 */
export function getGraduationYearOptions(
  selected?: string | number | null
): string[] {
  const years = getValidGraduationYears();
  const current = selected?.toString();
  if (current && !years.includes(current)) {
    years.push(current);
    years.sort((a, b) => Number(b) - Number(a));
  }
  return years;
}
