# handoff.md

## 현재 작업 방식

- GitHub `main` 기준으로 읽고 쓴다.
- 사용자는 StackBlitz에서 바로 확인한다.
- 로컬 `C:\Users\user\Documents\toad` 파일은 직접 수정하지 않는다.
- 최소 수정만 한다.
- `src/assets/toad.png` 유지. base64 금지.

## 실행 기준

- StackBlitz `.env` 필요:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase client 파일:
  - `src/supabaseClient.js`
- 의존성:
  - `@supabase/supabase-js`

## Supabase 연결 상태

현재 프론트는 `src/App.jsx`에서 `listings` 테이블을 직접 사용한다.

- 앱 시작 시 `listings` 전체 조회.
- 매물 등록 시 `listings`에 insert.
- 내 매물 상태 변경, 기한 연장, 가격 수정, 매물 정보 수정 시 `listings` update.

## listings 임시 소유자 기준

현재 로그인/회원 DB가 없어서 임시 소유자 키를 쓴다.

```js
const OWNER_KEY = "toad-demo-owner";
```

- 새 등록 매물에는 `owner_key = "toad-demo-owner"` 저장.
- 조회한 row의 `owner_key`가 같으면 `mine: true`로 변환.
- 나중에 Supabase Auth 붙이면 `owner_key`를 `user_id` 기준으로 교체해야 한다.

필수 SQL:

```sql
alter table listings
add column if not exists owner_key text;
```

주의:

- `owner_key` 칼럼이 없으면 앱은 fallback insert를 한다.
- fallback insert는 등록은 되지만 새로고침 후 `내 매물`로 유지되지 않는다.

## 현재 필요한 RLS 정책

프로토타입용이다. 운영 전에는 Auth 기준으로 다시 잠가야 한다.

```sql
create policy "public can read listings"
on listings
for select
to anon
using (true);

create policy "public can insert listings"
on listings
for insert
to anon
with check (true);

create policy "public can update listings"
on listings
for update
to anon
using (true)
with check (true);
```

## 임시 캐시 기준

`src/data/cache.js`는 메모리 캐시다.

- 승인/거절 상태는 `CACHE_KEYS.contactDecisions` 기준.
- 새로고침하면 초기화된다.
- 실제 DB 붙일 때는 별도 테이블로 분리해야 한다.

## 다음 개발 순서

1. `owner_key` SQL 적용 후 새 매물 등록/새로고침 확인.
2. `package-lock.json`에 `@supabase/supabase-js` 반영.
3. `contactDecisions`를 Supabase 테이블로 이동.
4. 프로필 수정 데이터를 Supabase 테이블로 이동.
5. 구독/결제 UI는 결제 완료 전까지 상태만 프론트에서 표시.
6. 실제 결제는 외부 결제 연동 전까지 mock 완료 화면만 둔다.

## 중요 경고

- 현재 `owner_key`는 임시 로그인 대체값이다.
- 운영 DB에서는 `owner_key` 대신 Supabase Auth `user.id`를 써야 한다.
- anon insert/update 정책은 테스트용이다.
- 새로고침 후 유지되어야 하는 상태는 `src/data/cache.js`에 두면 안 된다.
