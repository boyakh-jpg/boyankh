# handoff.map.md

## 목적

`handoff.storage.md`를 매번 읽지 않기 위한 파일 지도.
작업 시작 때 이 파일로 읽을 파일을 고른다.

## 기본 읽기 순서

1. `AGENTS.md`
2. `handoff.md`
3. `handoff.cache.md`
4. `handoff.map.md`
5. 작업별 대상 파일
6. 막히거나 과거 결정이 필요할 때만 `handoff.storage.md`

## 작업별 빠른 경로

- 앱 흐름/역할/라우팅: `src/App.jsx`, `src/data/demoUsers.js`, `src/utils/helpers.js`
- 홈: `src/components/Home.jsx`, `src/components/common.jsx`, `src/data/data.js`
- 내 매물/등록: `src/components/MyList.jsx`, `src/components/Register.jsx`, `src/App.jsx`
- 중개사 매물 열람: `src/components/Broker.jsx`, `src/data/cache.js`, `src/utils/helpers.js`
- 직거래 매물 열람: `src/components/BuyerExplore.jsx`, `src/data/cache.js`, `src/utils/helpers.js`
- 채팅/계약 체결: `src/components/Chat.jsx`, `src/data/cache.js`, `src/App.jsx`
- 설정/계정/결제/문의/신고: `src/components/Settings.jsx`, `src/components/Subscription.jsx`, `src/data/cache.js`
- 부동산 찾기/제안 승인: `src/components/BrokerOffices.jsx`, `src/components/common.jsx`, `src/data/cache.js`
- 공통 UI/팝업/카드: `src/components/common.jsx`, `src/components/modals.jsx`, `src/theme.js`
- Supabase 연결: `src/supabaseClient.js`, `src/data/cache.js`, `src/App.jsx`
- 더미 데이터: `src/data/data.js`, `src/data/demoUsers.js`
- 스타일/전역 레이아웃: `src/App.css`, `src/index.css`, `src/theme.js`
- 이미지/아이콘: `src/assets/toad.png`, `src/frogSprite.js`, `public/icons.svg`, `public/favicon.svg`

## 파일 지도

| 파일 | 역할 | 먼저 읽는 경우 |
|---|---|---|
| `handoff.md` | 시작 절차, 규칙 | 항상 |
| `handoff.cache.md` | 현재 상태, 다음 작업, 임시 SQL | 항상 |
| `handoff.map.md` | 파일 지도 | 항상 |
| `handoff.storage.md` | 확정 누적 기록 | 과거 결정 필요할 때만 |
| `README.md` | 기본 프로젝트 설명 | 거의 안 읽음 |
| `package.json` | 의존성/스크립트 | 설치/빌드 이슈 |
| `package-lock.json` | 잠금 파일 | 의존성 충돌 |
| `vite.config.js` | Vite 설정 | 배포/개발서버 이슈 |
| `eslint.config.js` | 린트 설정 | 린트 이슈 |
| `index.html` | 앱 진입 HTML | 흰화면/마운트 이슈 |
| `src/main.jsx` | React 마운트 | 흰화면/초기화 이슈 |
| `src/App.jsx` | 화면 전환, Supabase listings, 전역 상태 | 라우팅/역할/매물 저장 |
| `src/App.css` | 앱 프레임 CSS | 레이아웃 깨짐 |
| `src/index.css` | 전역 CSS | 폰트/스크롤/전체 배경 |
| `src/theme.js` | 색상/그림자 토큰 | 디자인 수정 |
| `src/supabaseClient.js` | Supabase client | 백엔드 연결 |
| `src/frogSprite.js` | 두꺼비 스프라이트 | 두꺼비 표시 |
| `src/assets/toad.png` | 유지해야 할 원본 이미지 | 삭제/교체 금지 |
| `src/utils/helpers.js` | 만료/신규/수수료/가격 계산 | 기준값/필터 오류 |
| `src/data/cache.js` | Supabase 임시 상태, 포인트, 채팅 컨텍스트 | 저장/권한/fallback |
| `src/data/data.js` | 더미 매물, 부동산, 채팅 데이터 | 더미/표시 데이터 |
| `src/data/demoUsers.js` | 테스트 아이디 선택 | 아이디 전환 |
| `src/components/Onboarding.jsx` | 시작/로그인/역할 선택 | 진입 흐름 |
| `src/components/Home.jsx` | 홈 카드/추천/오늘 할 일 | 홈 화면 |
| `src/components/Register.jsx` | 매물 등록 | 등록/insert |
| `src/components/MyList.jsx` | 내 매물 관리 | 만료/수정/연장 |
| `src/components/Broker.jsx` | 중개사 열람/번호 확인/안심의뢰 | 중개사 탭 |
| `src/components/BuyerExplore.jsx` | 직거래 열람/연락처 요청 | 직거래 탭 |
| `src/components/Chat.jsx` | 채팅 목록/채팅방/realtime | 채팅 |
| `src/components/BrokerOffices.jsx` | 부동산 찾기/제안 승인 | 부동산 메뉴 |
| `src/components/Settings.jsx` | 설정/하위 페이지/프로필/문의/신고 | 설정 |
| `src/components/Subscription.jsx` | 구독 UI | 구독 |
| `src/components/common.jsx` | 공통 컴포넌트/ListSheet/카드 | 공통 UI |
| `src/components/modals.jsx` | 결제/의뢰/메시지 팝업 | 팝업 |
| `public/icons.svg` | public 아이콘 | PWA/아이콘 |
| `public/favicon.svg` | favicon | 브라우저 아이콘 |

## 긴 파일 회피 규칙

- `handoff.storage.md`는 처음부터 끝까지 읽지 않는다.
- 필요한 키워드로만 검색한다.
- 예: `Select-String -Path handoff.storage.md -Pattern "contact_unlocks"`
- 예: `Select-String -Path handoff.storage.md -Pattern "채팅|contactDecisions|demo_app_state"`
- 코드도 전체 읽기 전에 `Select-String` 또는 `rg`로 대상 함수를 찾는다.

## 백엔드 전환 기준

- 임시 저장 계층: `src/data/cache.js`
- 현재 임시 테이블: `demo_app_state`
- 전용 테이블 후보:
  - `contact_unlocks`
  - `property_views`
  - `broker_applications`
  - `contact_requests`
  - `chats`
  - `chat_participants`
  - `chat_messages`
  - `listing_contracts`
  - `profiles`
  - `support_tickets`
  - `reports`

## 검증 기준

- 로컬 빌드 검증은 하지 않는다.
- 기본 검증: `git diff --check`
- 실제 확인: StackBlitz
- StackBlitz 반영 지연 시 `Restart`
