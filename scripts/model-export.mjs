import ExcelJS from 'exceljs';

const headers = [
  ['category_label', '제품 분류', 18], ['product_type', '제품 유형', 24],
  ['model_name', '모델명', 16], ['procurement_id', '조달식별번호', 18],
  ['registered_price', '조달등록가격(원)', 18], ['aspect_ratio', '화면비', 12],
  ['technology', '표시 방식', 12], ['screen_size_inch', '화면 크기(인치)', 16],
  ['brightness_nit', '밝기(nit)', 13], ['bezel_mm', '베젤(mm)', 12],
  ['pixel_pitch_mm', '픽셀피치(mm)', 15], ['resolution_width', '해상도 가로(px)', 17],
  ['resolution_height', '해상도 세로(px)', 17], ['width_mm', '제품 가로(mm)', 16],
  ['height_mm', '제품 세로(mm)', 16], ['depth_mm', '제품 깊이(mm)', 16],
  ['cabinet_width_mm', '캐비닛 가로(mm)', 17], ['cabinet_height_mm', '캐비닛 세로(mm)', 17],
  ['cabinet_depth_mm', '캐비닛 깊이(mm)', 17], ['cabinet_resolution_width', '캐비닛 해상도 가로', 20],
  ['cabinet_resolution_height', '캐비닛 해상도 세로', 20], ['pc_spec', 'PC 사양', 36],
  ['speaker', '스피커', 12], ['other_spec', '기타 사양', 30], ['source_note', '자료 메모', 42],
  ['published', '사이트 공개', 13], ['sort_order', '목록 순서', 12], ['updated_at', '최종 수정일', 22],
];

export async function buildModelWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OIC KOREA';
  workbook.created = new Date();
  workbook.properties = { title: 'OIC 조달 제품 사양·가격표', subject: '관리자 등록 제품 데이터' };
  const sheet = workbook.addWorksheet('제품 사양·가격', { properties: { defaultRowHeight: 24 } });
  sheet.addRow(headers.map(([, label]) => label));
  const first = sheet.getRow(1);
  first.height = 32;
  first.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203864' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  for (const row of rows) {
    const data = headers.map(([key]) => key === 'published' ? (row[key] ? '공개' : '비공개') : (row[key] ?? ''));
    const added = sheet.addRow(data);
    added.alignment = { vertical: 'top', wrapText: true };
    if (added.number % 2 === 0) added.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } };
    });
  }
  headers.forEach(([, , width], index) => { sheet.getColumn(index + 1).width = width; });
  sheet.getColumn(5).numFmt = '#,##0"원"';
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 3 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: headers.length } };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
