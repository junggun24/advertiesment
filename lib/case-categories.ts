export const CASE_PURPOSES = [
  '행정홍보안내',
  '교육환경개선',
  '안전재난관제',
  '시설환경개선',
] as const;

export type CasePurpose = (typeof CASE_PURPOSES)[number];

const legacyPurposeTerms: Record<CasePurpose, string[]> = {
  행정홍보안내: ['행정홍보안내', '행정', '시정', '홍보', '행사', '안내'],
  교육환경개선: ['교육환경개선', '교육', '학교', '문화'],
  안전재난관제: ['안전재난관제', '안전', '재난', '기상', '관제'],
  시설환경개선: ['시설환경개선', '시설', '환경', '리모델링', '실내'],
};

export function matchesCasePurpose(value: string, purpose: CasePurpose) {
  return legacyPurposeTerms[purpose].some((term) => value.includes(term));
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
