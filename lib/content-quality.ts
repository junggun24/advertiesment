import type { DisplayModel } from './display-models';

const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';
const list = (value: unknown) =>
  Array.isArray(value) ? value.filter(Boolean) : [];

export function missingImageAltCount(html: unknown) {
  if (typeof html !== 'string') return 0;
  return [...html.matchAll(/<img\b([^>]*)>/gi)].filter(
    (match) => !/\balt\s*=\s*(["'])[^"']+\1/i.test(match[1]),
  ).length;
}

export function contentQualityIssues(
  type: string,
  data: Record<string, unknown>,
) {
  const issues: string[] = [];
  if (type === 'product') {
    if (!text(data.body)) issues.push('상세 본문이 없습니다.');
    if (!text(data.author)) issues.push('작성자를 입력해 주세요.');
    if (!text(data.reviewer)) issues.push('검수자를 입력해 주세요.');
    if (!list(data.sourceUrls).length)
      issues.push('근거·참고 링크를 입력해 주세요.');
    if (!list(data.modelIds).length)
      issues.push('공개할 조달 모델을 연결해 주세요.');
  }
  if (type === 'case') {
    if (!text(data.body)) issues.push('설치 상세 본문이 없습니다.');
    if (!text(data.installedAt)) issues.push('설치 일자를 입력해 주세요.');
    if (!text(data.challenge) || !text(data.solution) || !text(data.result))
      issues.push('문제·해결 방법·설치 결과를 모두 입력해 주세요.');
    if (!text(data.author) || !text(data.reviewer))
      issues.push('작성자와 현장 검수자를 입력해 주세요.');
    if (!list(data.sourceUrls).length)
      issues.push('확인 가능한 근거 자료를 입력해 주세요.');
  }
  if (type === 'faq') {
    if (!text(data.updatedAt)) issues.push('최종 수정일을 입력해 주세요.');
    if (!text(data.author) || !text(data.reviewer))
      issues.push('작성자와 검수자를 입력해 주세요.');
    if (!list(data.sourceUrls).length)
      issues.push('답변 근거 출처를 입력해 주세요.');
  }
  const missingAlt = missingImageAltCount(data.body ?? data.details);
  if (missingAlt)
    issues.push(`대체 설명이 없는 본문 이미지가 ${missingAlt}개 있습니다.`);
  if (/http:\/\//i.test(text(data.body) || text(data.details)))
    issues.push(
      'HTTP 외부 주소가 포함되어 있습니다. HTTPS 또는 업로드 이미지로 교체해 주세요.',
    );
  return issues;
}

export function displayModelWarnings(
  model: DisplayModel,
  models: DisplayModel[] = [],
) {
  const warnings: string[] = [];
  if (!model.procurement_id) warnings.push('조달식별번호가 없습니다.');
  else if (
    models.some(
      (item) =>
        item.id !== model.id && item.procurement_id === model.procurement_id,
    )
  )
    warnings.push('다른 모델과 조달식별번호가 중복됩니다.');
  if (!model.registered_price) warnings.push('조달등록가격이 없습니다.');
  if (
    model.width_mm == null ||
    model.height_mm == null ||
    model.depth_mm == null
  )
    warnings.push('제품 외형 치수가 완전하지 않습니다.');
  if (!model.source_note) warnings.push('자료 출처 또는 확인 메모가 없습니다.');
  if (model.category.startsWith('led_') && model.pixel_pitch_mm == null)
    warnings.push('LED 픽셀피치가 없습니다.');
  if (
    model.category === 'video_wall' &&
    (model.resolution_width == null || model.resolution_height == null)
  )
    warnings.push('화면 해상도가 없습니다.');
  if (model.category === 'kiosk' && model.screen_size_inch == null)
    warnings.push('키오스크 화면 크기가 없습니다.');
  return warnings;
}
