export const inquiryCategories = [
  '행정홍보안내',
  '교육환경개선',
  '안전재난관제',
] as const;

export type InquiryCategory = (typeof inquiryCategories)[number];

export function isInquiryCategory(value: string): value is InquiryCategory {
  return inquiryCategories.some((category) => category === value);
}
