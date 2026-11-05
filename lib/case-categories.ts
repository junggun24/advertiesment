export const CASE_PURPOSES = [
  '행정홍보안내',
  '교육환경개선',
  '안전재난관제',
  '산업안전교육',
] as const;

export type CasePurpose = (typeof CASE_PURPOSES)[number];

export function isCasePurpose(value: unknown): value is CasePurpose {
  return CASE_PURPOSES.some((purpose) => purpose === value);
}

export function matchesCasePurpose(value: string, purpose: CasePurpose) {
  return value.trim() === purpose;
}

export function selectCaseExportItems<
  T extends { type: string; published: boolean; data: { purpose?: unknown } },
>(items: T[], purpose: CasePurpose, includeDrafts = false): T[] {
  return items.filter(
    (item) =>
      item.type === 'case' &&
      (includeDrafts || item.published) &&
      typeof item.data.purpose === 'string' &&
      matchesCasePurpose(item.data.purpose, purpose),
  );
}

export function formatCaseDisplaySize(
  rows?: string | number,
  columns?: string | number,
) {
  const rowValue = String(rows ?? '').trim();
  const columnValue = String(columns ?? '').trim();
  if (!rowValue || !columnValue) return '';
  return `${rowValue}단 × ${columnValue}열`;
}
