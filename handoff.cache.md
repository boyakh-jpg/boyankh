# handoff.cache.md

## 목적

현재 작업 상태와 다음 작업만 짧게 유지한다.
확정된 내용은 `handoff.storage.md`로 옮기고 이 파일에서 지운다.

## 현재 상태

- GitHub `main` 기준 작업.
- 마지막 푸시: `f640966 Show demo contact numbers after fast unlock`
- 사용자는 StackBlitz로 확인한다.
- 로컬 빌드 검증은 하지 않는다.

## 최근 반영

- 테스트 아이디 포인트 잔액 유지.
- 매물별 채팅방 참여자 분리.
- 소유주 B 매물 채팅이 소유주 A에게 보이지 않게 처리.
- 빠른의뢰 열람 후 더미 `소유주 연락처` 표시.
- 안심의뢰는 연락처 즉시 표시하지 않음.
- 연락처 원문은 채팅 메시지에 저장하지 않음.

## 다음 확인

- StackBlitz에서 중개사 빠른의뢰 열람 후 번호 표시 확인.
- 소유주 B 매물 등록 후 직거래 매수자 채팅이 소유주 B에게만 보이는지 확인.
- 테스트 아이디 변경 후 포인트가 유지되는지 확인.
- Vercel 흰화면이 남으면 배포 로그와 브라우저 콘솔을 먼저 확인.

## 작업 우선순위

1. Supabase 실제 테이블/RLS/API 기준으로 프론트 임시 로직 제거.
2. `contact_unlocks` 또는 RPC로 연락처 공개 권한 처리.
3. `chats`, `chat_participants`, `chat_messages` 권한형 구조로 전환.
4. `property_views`, `broker_applications`, `contact_requests` 저장.
5. 프론트 localStorage 캐시를 서버 데이터로 대체.

## storage 반영 후 지울 항목

- `최근 반영` 중 StackBlitz 검증 완료된 항목은 `handoff.storage.md`에 요약만 남기고 삭제.
- `다음 확인` 중 확인 완료된 항목은 삭제.
- 완료된 임시 SQL/정책 안내는 `handoff.storage.md`의 백엔드 기준 섹션으로 이동.

## 최근 커밋

- `f640966`: 빠른의뢰 연락처 더미 표시.
- `c08e393`: 매물별 채팅방 참여자 분리.
- `3872c2b`: 테스트 아이디별 포인트 유지.

## 임시 데이터/캐시

- `toad.chatContexts`: 매물별 채팅 컨텍스트 localStorage.
- `toad.{demoUserId}.brokerViewed`: 중개사 열람 목록.
- `toad.{demoUserId}.brokerContacted`: 중개사 연락처 열람 상태.
- `toad.{demoUserId}.brokerSafeRequests`: 중개사 안심의뢰 상태.
- `toad.pointBalance.{demoUserId}`: 포인트 fallback.
- `CACHE_KEYS.contactDecisions`: 승인/거절 메모리 캐시.
