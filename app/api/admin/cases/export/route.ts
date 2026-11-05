import { isAdminAuthenticated } from '@/lib/admin-auth';
import { dbApi } from '@/lib/db-api';
import { isCasePurpose, selectCaseExportItems } from '@/lib/case-categories';
import { renderCasePrintDocument } from '@/lib/case-print';
import type { ContentItem } from '@/lib/content-types';
import type { CaseStudy } from '@/lib/catalog';

export async function GET(request: Request) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  };
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401, headers },
    );
  const params = new URL(request.url).searchParams;
  const purpose = params.get('purpose');
  if (!isCasePurpose(purpose))
    return Response.json(
      { message: '올바른 설치 목적을 선택해 주세요.' },
      { status: 400, headers },
    );
  try {
    const data = (await dbApi('/content?type=case')) as {
      items: ContentItem<CaseStudy>[];
    };
    const items = selectCaseExportItems(
      data.items,
      purpose,
      params.get('includeDrafts') === '1',
    );
    if (!items.length)
      return Response.json(
        { message: '선택한 목적의 설치사례가 없습니다.' },
        { status: 404, headers },
      );
    return new Response(renderCasePrintDocument(items, purpose), {
      headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch {
    return Response.json(
      { message: '설치사례를 불러오지 못했습니다. 다시 시도해 주세요.' },
      { status: 503, headers },
    );
  }
}
