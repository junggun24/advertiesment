export type DisplayModel = {
  id: number;
  category: string;
  category_label: string;
  product_type: string;
  model_name: string;
  procurement_id: string;
  registered_price: number;
  aspect_ratio: string;
  technology: string;
  bezel_mm: number | null;
  pixel_pitch_mm: number | null;
  brightness_nit: number | null;
  width_mm: number | null;
  height_mm: number | null;
  depth_mm: number | null;
  resolution_width: number | null;
  resolution_height: number | null;
  cabinet_width_mm: number | null;
  cabinet_height_mm: number | null;
  cabinet_depth_mm: number | null;
  cabinet_resolution_width: number | null;
  cabinet_resolution_height: number | null;
  screen_size_inch: number | null;
  pc_spec: string;
  speaker: string;
  other_spec: string;
  source_note: string;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

export const displayModelFields = [
  'category',
  'category_label',
  'product_type',
  'model_name',
  'procurement_id',
  'registered_price',
  'aspect_ratio',
  'technology',
  'bezel_mm',
  'pixel_pitch_mm',
  'brightness_nit',
  'width_mm',
  'height_mm',
  'depth_mm',
  'resolution_width',
  'resolution_height',
  'cabinet_width_mm',
  'cabinet_height_mm',
  'cabinet_depth_mm',
  'cabinet_resolution_width',
  'cabinet_resolution_height',
  'screen_size_inch',
  'pc_spec',
  'speaker',
  'other_spec',
  'source_note',
  'sort_order',
  'published',
] as const;

const numericFields = new Set<string>([
  'registered_price',
  'bezel_mm',
  'pixel_pitch_mm',
  'brightness_nit',
  'width_mm',
  'height_mm',
  'depth_mm',
  'resolution_width',
  'resolution_height',
  'cabinet_width_mm',
  'cabinet_height_mm',
  'cabinet_depth_mm',
  'cabinet_resolution_width',
  'cabinet_resolution_height',
  'screen_size_inch',
  'sort_order',
]);

export function normalizeDisplayModel(
  row: Record<string, unknown>,
): DisplayModel {
  return { ...row, published: Boolean(row.published) } as DisplayModel;
}

function asText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

export function displayModelValues(input: Record<string, unknown>) {
  if (!asText(input.model_name)) throw new Error('모델명을 입력해 주세요.');
  if (!asText(input.category)) throw new Error('제품 분류를 선택해 주세요.');
  return displayModelFields.map((field) => {
    if (field === 'published') return input[field] === false ? 0 : 1;
    if (numericFields.has(field)) {
      if (input[field] === '' || input[field] == null)
        return field === 'registered_price' || field === 'sort_order'
          ? 0
          : null;
      const value = Number(input[field]);
      if (!Number.isFinite(value) || value < 0)
        throw new Error(`${field} 값이 올바르지 않습니다.`);
      return value;
    }
    return asText(input[field]);
  });
}

export function emptyDisplayModel(): DisplayModel {
  return {
    id: 0,
    category: 'video_wall',
    category_label: '비디오월',
    product_type: '',
    model_name: '',
    procurement_id: '',
    registered_price: 0,
    aspect_ratio: '16:9',
    technology: '',
    bezel_mm: null,
    pixel_pitch_mm: null,
    brightness_nit: null,
    width_mm: null,
    height_mm: null,
    depth_mm: null,
    resolution_width: null,
    resolution_height: null,
    cabinet_width_mm: null,
    cabinet_height_mm: null,
    cabinet_depth_mm: null,
    cabinet_resolution_width: null,
    cabinet_resolution_height: null,
    screen_size_inch: null,
    pc_spec: '',
    speaker: '',
    other_spec: '',
    source_note: '',
    sort_order: 0,
    published: true,
  };
}
