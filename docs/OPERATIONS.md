# OIC 홈페이지 운영 가이드

## 배포

- `main` 브랜치에 반영되면 GitHub Actions가 린트, 빌드, D1 마이그레이션, Worker 배포와 운영 점검을 순서대로 실행한다.
- GitHub 저장소에는 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` 두 Actions secret이 필요하다.
- 관리자 계정 및 Turnstile 비밀키는 Worker secret으로만 관리하며 저장소에 넣지 않는다.

### 최초 1회 활성화

1. Cloudflare API 토큰(Workers Scripts 편집, D1 편집, R2 편집 권한)을 GitHub Actions secret `CLOUDFLARE_API_TOKEN`으로 등록한다.
2. Turnstile 위젯에 `display.dsko.workers.dev`와 추후 연결할 운영 도메인을 등록한다.
3. 사이트 키는 Worker 변수 `TURNSTILE_SITE_KEY`, 비밀키는 Worker secret `TURNSTILE_SECRET_KEY`로 등록한다.
4. 운영 도메인을 연결하면 `TURNSTILE_ALLOWED_HOSTNAMES`도 쉼표로 구분해 갱신한다.

## 보안

- 문의 접수: IP 해시 기준 10분당 5회로 제한한다.
- 관리자 로그인: IP 해시 기준 15분당 5회로 제한한다.
- `TURNSTILE_SITE_KEY`와 `TURNSTILE_SECRET_KEY`가 설정되면 문의와 관리자 로그인은 Turnstile 서버 검증을 통과해야 한다.
- Turnstile 키를 만들기 전에도 요청 제한은 항상 적용되며, 키가 없으면 `security.turnstile_not_configured` 경고를 남긴다.

## 모니터링

- `GET /api/health`는 D1과 R2 연결 상태를 검사한다.
- GitHub Actions `Monitor Production`이 매시 7분과 37분에 홈페이지, 상태 API, robots.txt, sitemap.xml, 관리자 로그인 화면을 확인한다.
- 실패 시 GitHub Actions 실패 알림과 Cloudflare Worker 관찰 로그를 확인한다.
- 로그 이벤트는 JSON으로 기록하며 고객 이름, 연락처, 문의 내용은 기록하지 않는다.

## 백업

- D1은 Cloudflare Time Travel로 자동 보호된다. 무료 요금제의 복구 가능 기간은 7일이다.
- `Backup Cloudflare Data`가 매주 월요일 03:17(KST)에 실행된다.
- D1 전체 SQL과 R2 등록 파일, SHA-256 목록을 `ad-backup/backups/<UTC 시각>/`에 저장한다.
- 로컬에서 즉시 백업하려면 `npm run backup:cloudflare`를 실행한다.
- 복구는 먼저 Cloudflare D1 Time Travel로 원하는 시점을 확인한다. D1 복구는 기존 데이터를 덮어쓰므로 운영 책임자가 시각과 대상을 확인한 뒤 실행한다.
- R2 파일 복구는 백업의 `manifest.json`을 기준으로 `ad-backup` 객체를 `ad-bucket`의 원래 키로 복사한다.

## 장애 확인 순서

1. `/api/health` 응답과 `checks.database`, `checks.storage`를 확인한다.
2. GitHub Actions의 최근 배포와 모니터링 실행 결과를 확인한다.
3. Cloudflare Workers의 Observability 로그에서 `health.check_failed`, `inquiry.create_failed`, `security.*` 이벤트를 확인한다.
4. 데이터 오류이면 D1 Time Travel 복구 가능 시각과 `ad-backup`의 최신 백업을 확인한다.
