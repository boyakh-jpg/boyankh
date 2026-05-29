# handoff.cache.md

## 목적

현재 작업 상태와 다음 작업만 짧게 유지한다.
확정된 내용은 `handoff.storage.md`로 옮기고 이 파일에서 지운다.

## 현재 상태

- GitHub `main` 기준 작업.
- 마지막 푸시: `Back frontend state with Supabase`
- 사용자는 StackBlitz로 확인한다.
- 로컬 빌드 검증은 하지 않는다.

## 최근 반영

- 테스트 아이디 포인트 잔액 유지.
- 매물별 채팅방 참여자 분리.
- 소유주 B 매물 채팅이 소유주 A에게 보이지 않게 처리.
- 빠른의뢰 열람 후 더미 `소유주 연락처` 표시.
- 안심의뢰는 연락처 즉시 표시하지 않음.
- 연락처 원문은 채팅 메시지에 저장하지 않음.
- 프론트 임시 상태 일부를 Supabase `demo_app_state`에 저장하도록 연결.
- 연결 대상: 기본/관심지역 설정, 알림 설정, 프로필 저장, 문의/신고 접수, 중개사 열람/연락/안심의뢰/즐겨찾기, 직거래 열람/요청/즐겨찾기, 채팅방 컨텍스트, 연락처 승인/거절.
- Supabase 저장 실패 시 기존 브라우저 저장소 fallback 유지.
- 긴 `handoff.storage.md`를 매번 읽지 않도록 `handoff.map.md` 파일 지도 추가.

## 다음 확인

- StackBlitz에서 중개사 빠른의뢰 열람 후 번호 표시 확인.
- 소유주 B 매물 등록 후 직거래 매수자 채팅이 소유주 B에게만 보이는지 확인.
- 테스트 아이디 변경 후 포인트가 유지되는지 확인.
- 테스트 아이디 변경 후 열람/즐겨찾기/요청/채팅방/프로필이 유지되는지 확인.
- 다음 세션 시작 시 `handoff.map.md` 기준으로 필요한 파일만 읽는지 확인.
- Vercel 흰화면이 남으면 배포 로그와 브라우저 콘솔을 먼저 확인.

## 작업 우선순위

1. Supabase에 `demo_app_state` 임시 테이블/RLS 생성.
2. `contact_unlocks` 또는 RPC로 연락처 공개 권한 처리.
3. `chats`, `chat_participants`, `chat_messages` 권한형 구조로 전환.
4. `property_views`, `broker_applications`, `contact_requests` 전용 테이블로 분리.
5. `demo_app_state`에 묶은 임시 상태를 전용 테이블로 이관 후 제거.

## storage 반영 후 지울 항목

- `최근 반영` 중 StackBlitz 검증 완료된 항목은 `handoff.storage.md`에 요약만 남기고 삭제.
- `다음 확인` 중 확인 완료된 항목은 삭제.
- 완료된 임시 SQL/정책 안내는 `handoff.storage.md`의 백엔드 기준 섹션으로 이동.

## 최근 커밋

- `Back frontend state with Supabase`: 프론트 임시 상태를 Supabase `demo_app_state`에 연결.
- `f640966`: 빠른의뢰 연락처 더미 표시.
- `c08e393`: 매물별 채팅방 참여자 분리.
- `3872c2b`: 테스트 아이디별 포인트 유지.

## 임시 데이터/캐시

- `demo_app_state`: 전용 테이블 전환 전 임시 Supabase 상태 저장소.
- `toad.chatContexts`: 매물별 채팅 컨텍스트. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.brokerViewed`: 중개사 열람 목록. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.brokerContacted`: 중개사 연락처 열람 상태. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.brokerSafeRequests`: 중개사 안심의뢰 상태. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.brokerFavorites`: 중개사 즐겨찾기. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.buyerUnlocked`: 직거래 연락처 열람 상태. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.buyerRequests`: 직거래 안심 요청 상태. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.buyerFavorites`: 직거래 즐겨찾기. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.settingsProfile`: 설정 프로필. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.supportLastInquiry`: 마지막 문의 접수. `demo_app_state` + localStorage fallback.
- `toad.{demoUserId}.supportLastReport`: 마지막 신고 접수. `demo_app_state` + localStorage fallback.
- `toad.pointBalance.{demoUserId}`: 포인트 fallback.
- `CACHE_KEYS.contactDecisions`: 승인/거절. `demo_app_state` + 메모리/localStorage fallback.

## 임시 SQL

Supabase SQL editor에서 한 번 실행:

```sql
create table if not exists public.demo_app_state (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.demo_app_state enable row level security;

create policy "dev can read demo app state"
on public.demo_app_state
for select
to anon
using (true);

create policy "dev can insert demo app state"
on public.demo_app_state
for insert
to anon
with check (true);

create policy "dev can update demo app state"
on public.demo_app_state
for update
to anon
using (true)
with check (true);
```

운영 전에는 `demo_app_state`를 계속 쓰지 말고 전용 테이블/RLS로 분리해야 함.
