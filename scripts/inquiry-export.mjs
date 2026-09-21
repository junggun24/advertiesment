import ExcelJS from 'exceljs';

const sourceTypes = ['Ads', 'Organic', 'Direct', 'Referral', 'Unknown'];
const sourceLabels = {
  Ads: '광고',
  Organic: '자연검색',
  Direct: '직접 유입',
  Referral: '다른 사이트',
  Unknown: '확인 불가',
};
const statusLabels = {
  new: '신규',
  contacting: '상담 중',
  quoted: '견적 전달',
  contracted: '계약',
  closed: '종료',
};
const seoulDate = (value) =>
  new Date(new Date(value).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
const dateKey = (value) => {
  const d = seoulDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const monthKey = (value) => dateKey(value).slice(0, 7);
const weekKey = (value) => {
  const d = seoulDate(value);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const first = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(((d - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-${String(week).padStart(2, '0')}주`;
};
const elapsed = (seconds) => {
  const n = Number(seconds) || 0;
  if (n < 60) return `${n}초`;
  if (n < 3600) return `${Math.floor(n / 60)}분 ${n % 60}초`;
  return `${Math.floor(n / 3600)}시간 ${Math.floor((n % 3600) / 60)}분`;
};

const fills = {
  navy: '203864',
  blue: '3B65AD',
  green: '447F55',
  orange: 'C67A37',
  gray: '6B7280',
  light: 'EDF2F8',
};
function styleHeader(row, color = 'navy') {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${fills[color]}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD6DCE5' } } };
  });
}
function finishSheet(sheet, widths) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: widths.length },
  };
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.eachRow((row, index) => {
    if (index > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
      if (index % 2 === 0)
        row.eachCell(
          (cell) =>
            (cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF7F9FC' },
            }),
        );
    }
  });
}
function addSummary(workbook, name, rows, periodKey) {
  const sheet = workbook.addWorksheet(name, {
    properties: { defaultRowHeight: 22 },
  });
  const periods = [
    ...new Set(rows.map((row) => periodKey(row.created_at))),
  ].sort((a, b) => b.localeCompare(a));
  sheet.addRow([
    '기간',
    '전체 문의',
    ...sourceTypes.map((type) => sourceLabels[type]),
    '재방문 문의',
    '수집 점검 필요',
  ]);
  styleHeader(sheet.getRow(1), 'green');
  for (const period of periods) {
    const values = rows.filter((row) => periodKey(row.created_at) === period);
    sheet.addRow([
      period,
      values.length,
      ...sourceTypes.map(
        (type) =>
          values.filter((row) => (row.source_type || 'Unknown') === type)
            .length,
      ),
      values.filter((row) => (row.session_count || 1) > 1).length,
      values.filter((row) => row.quality_flags?.length).length,
    ]);
  }
  finishSheet(sheet, [16, 14, 14, 14, 14, 14, 14, 16, 18]);
}

export async function buildInquiryWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OIC KOREA';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties = {
    title: 'OIC 문의 데이터',
    subject: '문의 및 유입경로 관리 데이터',
  };

  const raw = workbook.addWorksheet('문의 RAW', {
    properties: { defaultRowHeight: 22 },
  });
  raw.addRow([
    '접수채널',
    '날짜',
    '시간',
    '성함',
    '연락처',
    '회사·기관',
    '최초 구분',
    '최초 매체',
    '최초 캠페인',
    '최초 광고그룹',
    '최초 소재',
    '최초 키워드',
    '최초 랜딩 페이지',
    '최종 구분',
    '최종 매체',
    '최종 캠페인',
    '최종 광고그룹',
    '최종 소재',
    '최종 키워드',
    '최종 랜딩 페이지',
    '문의 페이지',
    '첫방문→문의',
    '전체 페이지',
    '방문 세션',
    '현재 세션 페이지',
    '기기',
    '담당자',
    '처리상태',
    '문의내용',
    '개인정보 동의',
    '동의 문서 버전',
    '동의 시각',
    '내부메모',
    '수집 점검',
    '방문 여정',
    '원본',
  ]);
  styleHeader(raw.getRow(1), 'blue');
  for (const row of rows) {
    const d = seoulDate(row.created_at);
    raw.addRow([
      row.inquiry_channel,
      dateKey(row.created_at),
      d.toLocaleTimeString('ko-KR', { hour12: false }),
      row.name,
      row.contact,
      row.organization,
      sourceLabels[row.source_type] || '확인 불가',
      row.source_name,
      row.campaign,
      row.ad_group,
      row.content,
      row.keyword,
      row.landing_page,
      sourceLabels[row.last_source_type] || '확인 불가',
      row.last_source_name,
      row.last_campaign,
      row.last_ad_group,
      row.last_content,
      row.last_keyword,
      row.last_landing_page,
      row.submitted_page,
      elapsed(row.elapsed_seconds),
      row.page_view_count,
      row.session_count,
      row.session_page_view_count,
      row.device_type,
      row.assignee,
      statusLabels[row.status] || row.status,
      row.message,
      row.privacy_consent ? '동의' : '기록 없음',
      row.privacy_consent_version,
      row.privacy_consented_at,
      row.memo,
      (Array.isArray(row.quality_flags) ? row.quality_flags : []).join(' / '),
      JSON.stringify(row.journey || {}),
      JSON.stringify(row.attribution_raw || {}),
    ]);
  }
  finishSheet(
    raw,
    [
      16, 12, 12, 12, 18, 22, 12, 22, 24, 22, 22, 22, 34, 12, 22, 24, 22, 22,
      22, 34, 28, 16, 12, 12, 16, 10, 12, 12, 40, 14, 18, 24, 36, 34, 55, 55,
    ],
  );

  const data = workbook.addWorksheet('문의데이터', {
    properties: { defaultRowHeight: 22 },
  });
  data.addRow([
    '연도',
    '월',
    '주차',
    '날짜',
    '요일',
    '시간',
    '성함',
    '회사·기관',
    '최초 유입',
    '최초 상세경로',
    '최초 캠페인',
    '최종 유입',
    '최종 상세경로',
    '최종 캠페인',
    '랜딩 페이지',
    '문의 페이지',
    '전체 페이지',
    '방문 세션',
    '기기',
    '상태',
    '담당자',
  ]);
  styleHeader(data.getRow(1), 'gray');
  for (const row of rows) {
    const d = seoulDate(row.created_at);
    data.addRow([
      d.getFullYear(),
      d.getMonth() + 1,
      weekKey(row.created_at),
      dateKey(row.created_at),
      ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
      d.toLocaleTimeString('ko-KR', { hour12: false }),
      row.name,
      row.organization,
      sourceLabels[row.source_type] || '확인 불가',
      row.source_name,
      row.campaign,
      sourceLabels[row.last_source_type] || '확인 불가',
      row.last_source_name,
      row.last_campaign,
      row.landing_page,
      row.submitted_page,
      row.page_view_count,
      row.session_count,
      row.device_type,
      statusLabels[row.status] || row.status,
      row.assignee,
    ]);
  }
  finishSheet(
    data,
    [
      10, 8, 12, 12, 8, 12, 12, 22, 13, 24, 24, 13, 24, 24, 34, 28, 12, 12, 10,
      12, 12,
    ],
  );

  addSummary(workbook, '통계(월)', rows, monthKey);
  addSummary(workbook, '통계(주)', rows, weekKey);

  const codes = workbook.addWorksheet('코드', {
    properties: { defaultRowHeight: 24 },
  });
  codes.addRow(['구분', '표시값', '판정 기준']);
  styleHeader(codes.getRow(1), 'orange');
  [
    ['Ads', '광고', 'UTM 매체가 cpc·paid이거나 광고 클릭 식별자가 있는 경우'],
    ['Organic', '자연검색', '네이버·구글·다음·AI 검색 서비스에서 들어온 경우'],
    ['Direct', '직접 유입', '이전 주소와 캠페인 정보가 없는 경우'],
    ['Referral', '다른 사이트', '검색 외 외부 사이트나 UTM 출처로 들어온 경우'],
    ['Unknown', '확인 불가', '기존 데이터처럼 유입 정보가 저장되지 않은 경우'],
    ['utm_source', '매체', 'google, naver, newsletter처럼 유입을 보낸 곳'],
    ['utm_medium', '방식', 'cpc, organic, email처럼 유입 방식'],
    ['utm_campaign', '캠페인', '광고 또는 홍보 캠페인 이름'],
    ['utm_content', '소재', '배너·문구·버튼 등 소재 구분'],
    ['utm_term', '키워드', '검색광고 키워드'],
  ].forEach((row) => codes.addRow(row));
  finishSheet(codes, [20, 22, 72]);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
