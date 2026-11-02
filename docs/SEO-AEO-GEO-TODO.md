# 도메인 연결 후 SEO·AEO·GEO TODO

운영 주소는 `https://dsko.co.kr`이다. `display.dsko.co.kr`과 `www.dsko.co.kr`은 루트 도메인으로 영구 리다이렉트한다. 아래 체크 상태는 기존 운영 기록이며, 로컬 변경과 운영 반영 여부는 별도로 확인한다.

## 2026-11-02 색인 등록 준비

- Google Search Console에 `https://dsko.co.kr/` URL 접두어 속성을 추가하고 HTML 태그 인증코드를 확보했다. 소유권 확인은 아직 완료하지 않았다.
- Google 인증코드 기본값과 관리자 `/admin/seo`의 Google·네이버·Bing 인증코드 입력 기능을 코드에 추가했다. 아직 운영 배포 전이다.
- 네이버·Bing 인증코드는 아직 확보하지 않았다. 코드를 임의로 생성하거나 인증 완료로 표시하지 않는다.
- 공개 이미지 크롤링 허용 변경도 운영 배포가 필요하다.

### 배포 후 진행 순서

1. `npm run audit:indexing -- --output=outputs/indexing-audit.json`으로 운영 홈페이지의 인증 태그·robots.txt·사이트맵·주요 페이지를 확인한다. 추가 사례는 명령 뒤에 `/cases/사례-slug` 형태로 전달한다.
2. Google Search Console의 HTML 태그 인증 화면에서 소유권을 확인한다. 기본 코드와 다른 계정의 코드를 사용할 경우 관리자 SEO 설정에서 교체한다. 도메인 속성을 선택하면 HTML 태그 대신 DNS 인증이 필요하다.
3. 네이버 서치어드바이저와 Bing Webmaster Tools에 `https://dsko.co.kr/`을 추가하고 HTML 메타태그의 `content` 값만 관리자 SEO 설정에 저장한 뒤 각 서비스에서 소유권을 확인한다. 기존 DNS 등으로 인증됐다면 메타태그를 추가할 필요는 없다.
4. 각 서비스에 `https://dsko.co.kr/sitemap.xml`을 제출하고 처리 결과를 기록한다.
5. 홈·회사소개·제품 3개·정보·계산기·대표 사례를 URL 검사한다. Google에서는 실제 색인 상태, 최근 수집일, Google이 선택한 canonical, 제외 사유를 확인한다.
6. 미색인 원인을 수정한 페이지에 한해 수집을 요청하고, 1·2·4주 후 상태와 노출·클릭 변화를 비교한다. 제출이나 수집 요청 자체를 색인 완료로 기록하지 않는다.

`audit:indexing`은 공개 응답의 기술적 준비 상태만 검사한다. 기본 점검은 주요 페이지 9개이며 전체 사례를 자동으로 검사하지 않는다. 인증 태그가 있어도 소유권 확인 완료를 의미하지 않고, 태그가 없어도 DNS 등으로 인증됐을 수 있다. 실제 색인 여부는 검색엔진 계정에서 별도로 확인해야 한다.

| 확인일 | 검색엔진 | URL | 소유권 확인 | 사이트맵 처리 | 색인 상태·제외 사유 | 최근 수집일·선택 canonical | 조치·재확인일 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-02 | Google | https://dsko.co.kr/ | 인증 대기 | 미제출 | 미확인 | 미확인 | 인증코드 운영 배포 후 확인 |
| 2026-11-02 | 네이버 | https://dsko.co.kr/ | 미등록 | 미제출 | 미확인 | 미확인 | 계정에서 사이트 추가 필요 |
| 2026-11-02 | Bing | https://dsko.co.kr/ | 미등록 | 미제출 | 미확인 | 미확인 | 계정에서 사이트 추가 필요 |

참고: [Google 소유권 확인](https://support.google.com/webmasters/answer/9008080?hl=ko), [Google URL 검사](https://support.google.com/webmasters/answer/9012289?hl=ko), [네이버 수집 정책](https://searchadvisor.naver.com/guide/request-crawl).

## 도메인과 색인

- [x] 최종 운영 도메인에 HTTPS 적용
- [x] `metadataBase`, canonical, Open Graph URL을 최종 도메인으로 통일
- [x] `robots.txt`, `sitemap.xml`, Organization·WebSite 구조화 데이터 주소 통일
- [ ] Google Search Console 소유권 확인 및 사이트맵 제출
- [ ] Bing Webmaster Tools 소유권 확인 및 사이트맵 제출
- [ ] 네이버 서치어드바이저 소유권 확인 및 사이트맵 제출
- [ ] 주요 페이지 URL 검사 및 색인 요청

## 새 콘텐츠 알림과 측정

- [x] IndexNow 키 발급 및 `/indexnow-key.txt` 키 파일 배치
- [x] 제품·설치사례·FAQ 저장, 수정, 삭제 시 IndexNow 자동 알림 연결
- [x] 방문 분석 도구 연결 (Cloudflare Web Analytics 자동 설치, `dsko.co.kr`)
- [x] ChatGPT·Perplexity·Gemini 유입 문의 보고서 생성
- [ ] 검색엔진별 자연 검색 전환과 견적 문의 전환 측정
  - 관리자 문의 화면에 구글·네이버·빙·다음 검색별 문의 건수를 추가했다. 전환율 계산에는 검색엔진별 방문 수가 더 필요하다.

## 운영 품질

- [x] Google Rich Results Test로 제품·회사·담당자·Breadcrumb 검사
  - 2026-09-22 제품 페이지 재검사에서 제품 스니펫·탐색경로·지역 업체·회사 항목이 모두 유효했다. 담당자 페이지의 Person 스키마는 검사했으나 Google 리치 결과 유형으로는 표시되지 않았다.
- [ ] Search Console Core Web Vitals의 LCP, INP, CLS 확인
- [ ] 모바일 PageSpeed Insights 점검
  - 공개 API가 429로 응답했다. 대체 Lighthouse 모바일 단일 실행은 성능 60점, LCP 9.0초였으나 브라우저 캐시 정리 시간 초과 경고가 있어 재측정이 필요하다.
- [ ] 실제 제품 규격, 설치 실적, 작성자·검수자·근거 출처 보강
- [x] 제품 상세 페이지와 조달 모델 규격·가격 데이터 자동 연결
- [x] 관리자에 조달번호 중복, 규격·출처 누락, 본문 이미지 설명 누락 경고 추가
- [x] 기존 절대 주소 본문 이미지를 R2 상대 주소로 이전
- [ ] Google Business Profile, 네이버 지도, 카카오맵, 나라장터 등 회사명·주소·전화번호 통일
- [ ] 월 1회 색인 제외 페이지, 깨진 링크, 검색어와 AI 검색 유입 검토
  - 내부 링크 검사는 매월 1일 10:00 KST에 GitHub Actions로 자동 실행한다. 색인 제외·검색어 검토는 포털 계정 연결 후 추가해야 한다.

## AI 검색 대응

- [x] OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended 접근 허용
- [x] 회사 정보와 주요 페이지를 정리한 `/llms.txt` 제공
- [x] 문의 데이터에서 AI 검색 서비스별 유입 자동 분류·집계

## 외부 계정이 있어야 진행 가능한 항목

- Google Search Console: 소유권 인증 계정과 사이트맵 제출 권한 필요
- Bing Webmaster Tools·네이버 서치어드바이저: 각 서비스 로그인과 사이트 소유권 인증 필요
- GA4·광고 전환: 측정 ID, 전환 ID·라벨, 픽셀 ID 또는 API 토큰 필요
