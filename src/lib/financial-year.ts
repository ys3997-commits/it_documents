/** Indian financial year starts in April. 2025 means FY 2025-26. */
export function currentFinancialYearStart(now = new Date()): number {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function formatFinancialYear(start: number): string {
  return `FY ${start}-${String(start + 1).slice(-2)}`;
}

export function financialYearChoices(selected?: number): number[] {
  const current = currentFinancialYearStart();
  const years = new Set<number>();
  for (let year = current + 1; year >= current - 10; year -= 1) {
    years.add(year);
  }
  if (selected) years.add(selected);
  return [...years].sort((a, b) => b - a);
}

export function recentFinancialYears(): number[] {
  const current = currentFinancialYearStart();
  return [current + 1, current, current - 1, current - 2];
}
