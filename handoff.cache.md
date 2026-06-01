# handoff.cache.md

## 목적

현재 작업 상태와 다음 작업만 짧게 유지한다.
확정된 내용은 `handoff.storage.md`로 옮기고 이 파일에서 지운다.

## 현재 상태

- GitHub `main` 기준 작업.
- 마지막 푸시: `Add address lookup`
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
- 일부 임시 상태는 전용 테이블을 먼저 읽고 쓰도록 분기. 테이블이 없거나 실패하면 기존 `demo_app_state` fallback 유지.
- 전용 테이블 우선 대상: `contact_unlocks`, `property_views`, `broker_applications`, `contact_requests`, `chats`, `profiles`, `support_tickets`, `reports`.
- 오늘 확인할 일 체크를 `toad.{demoUserId}.{role}.todayTasks.{date}` 캐시에 저장.
- 소유주 홈 제안 수는 실제 제안 목록 + 승인/거절 + 열람 캐시 기준으로 계산.
- `새롭게 제안한 부동산/직거래 매수자`는 아직 확인하지 않았고 승인/거절하지 않은 항목만 표시.
- 부동산 메뉴는 전체 부동산 리스트와 상세 팝업만 표시. 승인/거절은 의뢰받은 목록에서만 표시.
- 빠른의뢰 제안은 승인/거절 버튼 숨김. 안심의뢰만 승인/거절 표시.
- `listings` 쓰기 보안 migration 추가. `anon` 조회 유지, insert/update/delete는 `authenticated` + `user_id = auth.uid()` 기준.
- 프론트 `listings` 등록/수정은 Supabase Auth 유저가 없으면 중단. 실패 시 로컬 성공 처리하지 않음.
- Supabase 저장 실패 시 기존 브라우저 저장소 fallback 유지.
- 긴 `handoff.storage.md`를 매번 읽지 않도록 `handoff.map.md` 파일 지도 추가.
- 실제 테스트 환경 seed migration 추가: `202605290002_seed_demo_runtime.sql`.
- seed는 `demo_users` 소유주 20명, 중개사 30명, 직거래 매수자 10명, 소유주 매물 50개, 부동산/직거래 제안을 만든다.
- 프론트는 `demo_users`, `broker_offices`, `broker_proposals`, `direct_buyer_proposals`, `listings`를 Supabase에서 먼저 읽는다.
- 설정 화면 테스트 아이디는 소유주/중개사/직거래 매수자 드롭다운으로 분리.
- 앱 시작 시 정적 매물 더미를 화면에 먼저 넣지 않음. SQL 미실행 시 매물/부동산/제안은 비어 보일 수 있다.
- 채팅방 계약 체결은 `listing_contracts` 전용 테이블을 먼저 읽고 쓴다. 테이블이 없으면 기존 `toad.listingContracts` fallback 유지.
- `listing_contracts` 저장 시 DB trigger가 해당 `listings` 행을 `done`으로 만료 처리한다.
- 매물유형은 `주거`, `정비/분양권`, `상업/업무`, `토지/산업` 그룹으로 정리. 등록/중개사 필터/직거래 필터가 같은 유형 목록을 쓴다.
- 매물 등록 주소 입력은 Daum/Kakao 우편번호 주소검색 팝업으로 선택한다.
- 주소검색 선택값에서 `address`, `zonecode`, `roadAddress`, `jibunAddress`, `region`, `dong`, `complex`를 저장한다.
- 영어 seed 주소를 한글 주소/지역/동/단지명으로 바꾸는 migration 추가: `202606010003_koreanize_addresses.sql`.

## 다음 확인

- Supabase SQL Editor에서 `202605290001_secure_listings_rls.sql`, `202605290002_seed_demo_runtime.sql` 순서로 실행.
- StackBlitz에서 설정 드롭다운에 소유주 20명, 중개사 30명, 직거래 매수자 10명이 보이는지 확인.
- `owner-001`에서 진행 의뢰/의뢰받은 부동산/직거래 매수자/새 제안 숫자가 DB seed 기준으로 보이는지 확인.
- 오늘 확인할 일 체크 후 다른 페이지 이동/복귀 시 체크 유지 확인.
- 새롭게 제안한 부동산 열람/승인/거절/채팅 후 새 제안 숫자에서 제외되는지 확인.
- 빠른의뢰 제안에는 승인/거절 버튼이 없는지 확인.
- 다음 세션 시작 시 `handoff.map.md` 기준으로 필요한 파일만 읽는지 확인.
- Vercel 흰화면이 남으면 배포 로그와 브라우저 콘솔을 먼저 확인.
- Supabase SQL Editor에서 `202606010001_create_listing_contracts.sql` 실행 후 채팅방 계약 체결 시 매물 상태가 완료로 바뀌는지 확인.
- Supabase SQL Editor에서 `202606010002_group_property_types.sql` 실행 후 `listing_prop_type_distribution` 결과 확인.
- Supabase SQL Editor에서 `202606010003_koreanize_addresses.sql` 실행 후 `listing_address_quality` 결과 확인.

## 작업 우선순위

1. Supabase에 `demo_app_state` 임시 테이블/RLS 생성 여부 확인.
2. Supabase에 전용 임시 테이블/RLS 생성.
3. StackBlitz에서 테스트 아이디 변경 후 포인트/열람/즐겨찾기/요청/채팅방/프로필 유지 확인.
4. `contact_unlocks` 또는 RPC로 연락처 공개 권한 처리.
5. `chats`, `chat_participants`, `chat_messages` 권한형 구조로 전환.
6. `listing_contracts` 정책을 Supabase Auth/RPC 기준으로 강화.
7. `demo_app_state`에 남은 기본/관심지역, 알림, 즐겨찾기류 임시 상태를 전용 구조로 이관 후 제거.

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
- `toad.listingContracts`: 계약 체결 fallback. `listing_contracts` 우선, 없으면 `demo_app_state` + localStorage fallback.
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
- `CACHE_KEYS.proposalViews`: 제안 열람 여부. `demo_app_state` + 메모리/localStorage fallback.

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

전용 임시 테이블도 Supabase SQL editor에서 한 번 실행:

```sql
create table if not exists public.contact_unlocks (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.property_views (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.broker_applications (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  state_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.contact_unlocks enable row level security;
alter table public.property_views enable row level security;
alter table public.broker_applications enable row level security;
alter table public.contact_requests enable row level security;
alter table public.chats enable row level security;
alter table public.profiles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.reports enable row level security;

create policy "dev can read contact unlocks" on public.contact_unlocks for select to anon using (true);
create policy "dev can write contact unlocks" on public.contact_unlocks for insert to anon with check (true);
create policy "dev can update contact unlocks" on public.contact_unlocks for update to anon using (true) with check (true);

create policy "dev can read property views" on public.property_views for select to anon using (true);
create policy "dev can write property views" on public.property_views for insert to anon with check (true);
create policy "dev can update property views" on public.property_views for update to anon using (true) with check (true);

create policy "dev can read broker applications" on public.broker_applications for select to anon using (true);
create policy "dev can write broker applications" on public.broker_applications for insert to anon with check (true);
create policy "dev can update broker applications" on public.broker_applications for update to anon using (true) with check (true);

create policy "dev can read contact requests" on public.contact_requests for select to anon using (true);
create policy "dev can write contact requests" on public.contact_requests for insert to anon with check (true);
create policy "dev can update contact requests" on public.contact_requests for update to anon using (true) with check (true);

create policy "dev can read chats" on public.chats for select to anon using (true);
create policy "dev can write chats" on public.chats for insert to anon with check (true);
create policy "dev can update chats" on public.chats for update to anon using (true) with check (true);

create policy "dev can read profiles" on public.profiles for select to anon using (true);
create policy "dev can write profiles" on public.profiles for insert to anon with check (true);
create policy "dev can update profiles" on public.profiles for update to anon using (true) with check (true);

create policy "dev can read support tickets" on public.support_tickets for select to anon using (true);
create policy "dev can write support tickets" on public.support_tickets for insert to anon with check (true);
create policy "dev can update support tickets" on public.support_tickets for update to anon using (true) with check (true);

create policy "dev can read reports" on public.reports for select to anon using (true);
create policy "dev can write reports" on public.reports for insert to anon with check (true);
create policy "dev can update reports" on public.reports for update to anon using (true) with check (true);
```
