# 도메인 연결 후 SEO·AEO·GEO TODO

현재 운영 주소는 `https://display.dsko.workers.dev`이다. 개발로 자동화할 수 있는 작업은 완료했으며, 검색 포털 계정 인증이 필요한 작업은 아래에 남겨 둔다.

## 도메인과 색인

- [x] 최종 운영 도메인에 HTTPS 적용
- [ ] HTTP, DDNS, 기존 Sites 주소를 최종 도메인으로 301 이동
- [x] `metadataBase`, canonical, Open Graph URL을 최종 도메인으로 통일
- [x] `robots.txt`, `sitemap.xml`, Organization·WebSite 구조화 데이터 주소 통일
- [ ] Google Search Console 소유권 확인 및 사이트맵 제출
- [ ] Bing Webmaster Tools 소유권 확인 및 사이트맵 제출
- [ ] 네이버 서치어드바이저 소유권 확인 및 사이트맵 제출
- [ ] 주요 페이지 URL 검사 및 색인 요청

## 새 콘텐츠 알림과 측정

- [x] IndexNow 키 발급 및 `/indexnow-key.txt` 키 파일 배치
- [x] 제품·설치사례·FAQ 저장, 수정, 삭제 시 IndexNow 자동 알림 연결
- [ ] 방문 분석 도구 연결
- [x] ChatGPT·Perplexity·Gemini 유입 문의 보고서 생성
- [ ] 검색엔진별 자연 검색 전환과 견적 문의 전환 측정

## 운영 품질

- [ ] Google Rich Results Test로 제품·회사·담당자·Breadcrumb 검사
- [ ] Search Console Core Web Vitals의 LCP, INP, CLS 확인
- [ ] 모바일 PageSpeed Insights 점검
- [ ] 실제 제품 규격, 설치 실적, 작성자·검수자·근거 출처 보강
- [ ] Google Business Profile, 네이버 지도, 카카오맵, 나라장터 등 회사명·주소·전화번호 통일
- [ ] 월 1회 색인 제외 페이지, 깨진 링크, 검색어와 AI 검색 유입 검토

## AI 검색 대응

- [x] OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended 접근 허용
- [x] 회사 정보와 주요 페이지를 정리한 `/llms.txt` 제공
- [x] 문의 데이터에서 AI 검색 서비스별 유입 자동 분류·집계

## 외부 계정이 있어야 진행 가능한 항목

- Google Search Console: 소유권 인증 계정과 사이트맵 제출 권한 필요
- Bing Webmaster Tools·네이버 서치어드바이저: 각 서비스 로그인과 사이트 소유권 인증 필요
- GA4·광고 전환: 측정 ID, 전환 ID·라벨, 픽셀 ID 또는 API 토큰 필요
- 301 이동: `domob.ddns.net`을 제공하는 기존 서버나 공유기 설정 권한 필요
