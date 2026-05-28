# handoff.md

## 목적

이 파일은 `toad` 작업 시작용 인수인계 진입점이다.
긴 누적 기록은 `handoff.storage.md`, 현재 작업 상태와 정리 대기 항목은 `handoff.cache.md`를 본다.

## 반드시 읽는 순서

1. `AGENTS.md`
2. `handoff.md`
3. `handoff.cache.md`
4. `src/App.jsx`
5. 최근 수정 파일
6. 필요할 때만 `handoff.storage.md`

## 작업 기준

- GitHub `main` 최신 상태 기준으로 시작한다.
- 로컬 원본 폴더는 직접 수정하지 말고 GitHub `main`에 커밋/푸시한다.
- 사용자는 StackBlitz로 확인한다.
- StackBlitz 반영이 늦으면 `Restart` 또는 새로고침을 안내한다.
- 로컬 빌드 검증은 하지 않는다.
- 가능한 검증은 `git diff --check`와 정적 검색 기준으로 한다.
- `src/assets/toad.png` 유지. base64 금지.

## 문서 역할

- `handoff.md`: 시작 절차, 읽는 순서, 작업 규칙.
- `handoff.cache.md`: 현재 변경 상태, 다음 작업, 저장장치로 옮길 항목.
- `handoff.storage.md`: 확정된 누적 기록, 백엔드 교체 기준, 과거 결정.

## 문서 갱신 규칙

- 새 작업 중 생긴 임시 프론트 백엔드 로직은 먼저 `handoff.cache.md`에 적는다.
- 작업이 검증/푸시되면 확정 내용만 `handoff.storage.md`에 옮긴다.
- `handoff.cache.md`에는 `storage 반영 후 지울 항목`을 같이 적는다.
- 오래된 세부 로그는 `handoff.md`에 쓰지 않는다.

## 현재 확인할 파일

- `src/App.jsx`
- `src/components/Broker.jsx`
- `src/components/BuyerExplore.jsx`
- `src/components/Chat.jsx`
- `src/components/Settings.jsx`
- `src/components/common.jsx`
- `src/data/cache.js`
- `src/data/data.js`
- `src/utils/helpers.js`

## 핵심 주의

- 승인/거절 상태는 `src/data/cache.js` 메모리 캐시 기준이다.
- 새로고침하면 일부 임시 캐시는 초기화된다.
- 포인트는 `user_points` 또는 localStorage fallback 기준이다.
- 채팅 컨텍스트는 현재 `toad.chatContexts` localStorage 임시 인덱스다.
- 실제 서비스에서는 Supabase Auth, RLS, 서버 RPC/API로 교체해야 한다.
