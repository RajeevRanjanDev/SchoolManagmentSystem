/**
 * Financial / academic years in "YYYY-YYYY" form (Indian April–March style),
 * spanning a few years around the current one so dropdowns stay stable.
 */
export function academicYears(): string[] {
  const now = new Date();
  // Academic year starts in April; before April we're still in the previous one.
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const years: string[] = [];
  for (let y = startYear - 3; y <= startYear + 2; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

/** The current academic year, e.g. "2026-2027". */
export function currentAcademicYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}
