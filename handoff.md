# handoff.md

## 목적

`toad` 프로젝트의 현재 구현 상태, 최근 수정 내용, 남은 작업을 다음 작업자가 바로 이어받기 위한 인수인계 문서다.

## 작업 환경

- 작업 폴더: `C:\Users\user\Documents\toad`
- 실제 실행/확인은 StackBlitz 기준이다.
- 사용 흐름: StackBlitz 수정 → `Create & Push` → GitHub `main` → Vercel 자동 배포
- 로컬에는 현재 `package.json`이 없어 `npm run build` 같은 검증을 바로 실행할 수 없다.
- `git`, `gh`도 로컬 기준 사용 불가로 봐야 한다.
- 두꺼비 이미지는 `src/assets/toad.png`를 유지한다. base64로 바꾸지 않는다.

## 인수인계 갱신 규칙

- 대화 중 백엔드가 맡아야 할 기능이 새로 나오면 바로 `프론트에 임시로 들어간 백엔드 역할`에 추가한다.
- 프론트에 더미로 만든 백엔드 데이터는 바로 이 문서에 표시한다.
- 실제 백엔드 구축 시 지우거나 API로 교체해야 할 프론트 상태/더미 데이터도 바로 기록한다.
- 포인트, 결제, 채팅, 알림, 권한, 매물 저장, 부동산 인증, 리뷰, 계약 체결은 기본적으로 백엔드 검토 대상으로 본다.
- 단순 화면 상태, 필터 UI, 팝업 열림/닫힘, 입력 중 draft는 프론트 유지 가능 항목으로 본다.

## 용어 통일

- 탭: 상단 역할 전환 버튼의 `소유주`, `중개사`, `직거래`
- 메뉴: 하단 버튼의 `홈`, `의뢰하기`, `부동산`, `채팅`, `내 매물`, `매물`, `직거래 매물`, `구독`
- 소유주: 집주인/임대인을 모두 포함하는 표현
- 직거래: 중개사 없이 매물을 찾는 매수자/임차인 흐름

## 현재 파일 구조

- `src/App.jsx`: 화면 라우팅, 역할 상태, 공용 매물 상태, 설정 저장
- `src/theme.js`: 색상, 배경, 그림자 토큰
- `src/frogSprite.js`: `src/assets/toad.png` import
- `src/assets/toad.png`: 두꺼비 스프라이트 PNG
- `src/data/data.js`: 매물 100개, 지역/거래유형 데이터, 부동산 카드 데이터
- `src/utils/helpers.js`: 완료/신규/만료/수수료/가격추이 헬퍼
- `src/components/common.jsx`: 공용 UI, `Frog`, `RoleToggle`, `Tag`, `PriceTrend`, `FeeEstimate`, `MiniMap`
- `src/components/Onboarding.jsx`: 첫 화면, 로그인, 역할 선택
- `src/components/Home.jsx`: 소유주/중개사/직거래 홈
- `src/components/Register.jsx`: 매물 의뢰 등록
- `src/components/Broker.jsx`: 중개사 매물 보기
- `src/components/BuyerExplore.jsx`: 직거래 매물 찾기
- `src/components/MyList.jsx`: 소유주 내 매물
- `src/components/BrokerOffices.jsx`: 소유주용 부동산 리스트/카드
- `src/components/Chat.jsx`: 채팅 목록/방
- `src/components/Subscription.jsx`: 중개사 구독
- `src/components/Settings.jsx`: 설정
- `src/components/modals.jsx`: 신청/결제/메시지 모달

## 최근 구현 상태

- 단일 `App.jsx` 구조에서 컴포넌트 파일 분리 완료
- `src/frogSprite.js`는 PNG import 방식 유지
- `Frog` 공통 컴포넌트의 스프라이트 잘림 수정
  - 원인: 160px 스프라이트를 scale한 뒤 flex 가운데 정렬하면서 좌상단이 잘림
  - 처리: 내부 스프라이트를 `position: absolute; top: 0; left: 0`으로 고정
- 홈 헤더 오른쪽 영역이 줄어들지 않도록 `Home.jsx` 헤더 flex 보강
- 로그인 흐름 분리
  - 일반 사용자는 `소유주`, `직거래`만 선택
  - 중개사로 시작하면 `소유주`, `중개사`, `직거래` 모두 선택 가능
- `중개사로 시작하기` 버튼은 백엔드 없는 프로토타입용 임시 장치다.
  - 실제 백엔드 개발 시 회원 유형/권한값으로 판단하고 별도 버튼은 제거하는 방향
- 탭 전환도 계정 유형을 따른다.
  - 일반 사용자: `소유주` ↔ `직거래`
  - 중개사: `소유주` → `중개사` → `직거래`
- 첫 화면, 로그인 화면, 역할 선택 화면의 오른쪽 점세개 제거
- 앱 내부 상단 오른쪽은 톱니바퀴 설정 버튼으로 변경
- `Settings.jsx` 추가
  - 내 지역
  - 알림
  - 중개사 설정 안내
  - 계정 정보
- 설정값은 브라우저 `localStorage`에 저장
  - `toad.preferredRegion`
  - `toad.interestRegion`
  - `toad.notifications`
- 홈 메뉴 통일
  - 소유주 홈
  - 중개사 홈
  - 직거래 홈
- 홈 헤더 문구 정리
  - `소유주 홈` / `빠르게 집을 내놓아요`
  - `공인중개사 홈` / `중개 매물이 있어요`
  - `직거래 홈` / `쉽게 집을 찾아요`
- 중개사 하단 메뉴에서 `구독` 제거
  - 구독 관리는 `설정 > 중개사 설정`과 중개사 홈의 구독 안내 카드에서 진입
- 직거래 헤더 두꺼비는 `Frog mood="cool"` 스프라이트 자체를 `common.jsx`의 `cool:{col:3,row:3,y:11}`로 보정
- 헤더 토글 버튼은 `RoleToggle`에서 `translateY(3px)`로 보정
- 설정 톱니바퀴는 버튼 내부 `span`에서 `translateY(-1px)`로 중앙 보정
- 홈의 추천 매물은 `기본지역 추천 매물`과 `관심지역 추천 매물` 섹션을 분리
- 중개사 홈 추천 매물은 예상 중개보수와 열람수를 함께 보고 우선순위 계산
- 직거래 홈 추천 매물은 가격 인하폭과 열람수를 함께 보고 우선순위 계산
- 중개사/직거래 홈의 추천 매물 카드는 매물 리스트로 이동하지 않고 홈에서 상세 sheet를 바로 표시
- 소유주 홈의 추천 부동산은 `기본지역 추천 부동산`과 `관심지역 추천 부동산` 섹션을 분리
- 부동산 티어가 높고 지역 순위가 높을수록 홈 노출 우선순위가 높음
- 소유주 홈의 가격추이 요약은 제거하고 `내 매물` 1~2개 요약으로 변경
- 중개사/직거래 매물 메뉴 진입 시 `기본 지역`을 지역 드랍박스 첫 선택값으로 적용
- 부동산 메뉴 진입 시 `기본 지역 + 관심 지역`을 기본 지역 필터로 사용
- 설정 화면은 상단 `돌아가기` 버튼을 제거하고 하단 `설정 저장` 버튼으로 복귀
- 중개사/직거래 홈 상단 통계 3칸은 `기본지역 매물`, `관심지역 매물`, `3일 신규매물`로 통일
- 소유주 홈 상단 통계 3칸은 `진행 의뢰`, `의뢰받은 부동산`, `직거래 매수자`로 정리
  - `진행 의뢰`는 내 매물 화면의 기본 데모 진행의뢰 2건과 새 등록 매물을 합산
  - `의뢰받은 부동산`은 내 의뢰를 받은 부동산 리스트 팝업
  - `직거래 매수자`는 내 물건을 열람하거나 안심의뢰한 직거래 매수자 리스트 팝업
- `부동산 제안` 표현은 `오늘 확인할 일`의 새 제안 항목에만 사용하고, 홈 하단 섹션은 추천 부동산으로 유지
- 소유주 홈의 `오늘 확인할 일`에는 `새롭게 제안한 부동산` 항목 표시
  - 누르면 아직 확인하지 않은 새 부동산 제안만 팝업으로 표시
  - 팝업의 `모든 부동산 리스트보기`를 누르면 전체 제안 부동산 목록 표시
- 소유주 홈의 `오늘 확인할 일`에는 `새롭게 제안한 직거래 매수자` 항목 표시
  - 누르면 아직 확인하지 않은 새 직거래 매수자만 팝업으로 표시
  - 팝업의 `모든 직거래 매수자 리스트보기`를 누르면 전체 직거래 매수자 목록 표시
- 부동산 제안 팝업, 직거래 매수자 팝업, 소유주 `부동산` 메뉴의 카드에서 안심의뢰 연락처 공개를 `승인`/`거절` 처리 가능
  - 승인/거절 상태는 채팅방의 연락처 공개 요청 카드와 공유
  - 직거래 안심의뢰는 `direct-safe-1` 요청키로 저장해 기존 `c3` 채팅 캐시와 분리
  - 팝업에서 이미 결정한 요청은 채팅방에서 승인/거절 버튼을 중복 표시하지 않음
  - 승인/거절 클릭 시 흰화면이 뜨지 않도록 `App.jsx` 전역 `contactDecisions` state 경로는 제거하고 `src/data/cache.js` 메모리 캐시만 사용
- 부동산/직거래 제안 팝업 카드에는 `응답 매물`을 표시해 여러 진행의뢰 중 어느 매물 응답인지 구분
- 중개사/직거래 매물 상세 sheet 우측 상단 `X` 버튼 중앙 정렬 보정
- 홈의 `3일 신규`, `만료 임박`, `수수료 높은 매물`, `가격 인하 매물` 카드/행을 누르면 필터 preset을 들고 해당 메뉴로 이동
- 중개사/직거래 매물 필터에 `열람한 매물 숨기기` 적용
- 매물목록의 지역 드랍박스가 `전체`이면 실제 전체 지역을 표시
- 기본지역은 중개사/직거래 `매물`/`열람목록` 진입 시 지도와 지역 필터 드랍박스의 첫 선택값으로 표시
- 관심지역은 기본지역과 함께 홈 추천 매물, 부동산, 신규 매물, 만료 임박 계산에만 반영
- 숨은 지역 필터는 금지. 필터가 걸려 있으면 반드시 지역 드랍박스에 보여야 함
- 중개사/직거래 매물 지도 핀 클릭은 목록을 즉시 필터링하지 않고 지역/동 드랍박스 값만 변경
  - 실제 목록 반영은 `필터 적용` 버튼으로만 처리
- 중개사/직거래 하단 메뉴에 `열람목록` 추가
  - 기존 필터 안의 `열람 목록` 버튼은 제거
  - 메뉴 전환으로 `listMode: "viewed"`를 적용
  - `열람목록` 메뉴에서는 `열람 숨기기`만 숨기고 `즐겨찾기` 필터는 유지
  - `필터 해제`를 눌러도 현재 메뉴의 `listMode`를 유지
- 중개사/직거래 매물 목록에 `즐겨찾기` 추가
  - 매물 카드와 상세 sheet의 별 버튼으로 저장/해제
  - 즐겨찾기는 열람 여부와 독립된 상태
  - `열람목록`의 즐겨찾기 필터는 열람된 매물 중 즐겨찾기된 것만 표시
  - 필터 버튼 텍스트에는 숫자 카운트를 표시하지 않음
  - 필터 버튼 문구는 상태에 따라 `즐겨찾기만 보기` / `전체리스트 보기`로 전환
- 중개사/직거래 매물 목록 정렬 전 `expiresInDays <= 0`인 기한 만료 매물은 제외
- `열람목록` 메뉴에서는 지도/필터 패널/필터 적용 버튼을 기본 접힘 처리하고 `필터창 보이기`/`필터창 숨기기` 작은 버튼으로 토글
- `열람목록`의 `필터 해제` 버튼은 목록 상단이 아니라 필터창 내부에만 표시
- `열람목록`의 `즐겨찾기` 필터는 `필터 적용` 버튼 없이 즉시 `appliedFilters.listMode`까지 반영
- `열람목록`에서 이미 연락처를 열람한 매물은 `연락처 확인됨` 문구 대신 실제 소유주 연락처를 표시
- 중개사 `열람목록`에서는 `기본 인사 메시지` 카드를 숨김
- 매물목록의 `즐겨찾기만 보기`와 `열람 숨기기`는 같은 줄에 배치하고 `필터 적용` 버튼으로 반영
- 화면 배경은 메뉴별로 바꾸지 않고 공통 `G.pageBg` 유지
- 메뉴 구분은 배경색이 아니라 헤더 제목 문구로 처리
  - 직거래 열람목록 헤더 제목은 `열람한 매물` 사용
- 같은 탭 안의 `매물`/`열람목록` 헤더 내부 보조 박스와 칩 배경은 동일하게 유지
- 직거래 금액대 필터 슬라이더는 낮은 금액 구간을 촘촘하게 움직이도록 비선형 곡선으로 변환
- 직거래 금액대 필터에 최소/최대 금액 직접 입력칸 추가
- 홈/매물/부동산/내매물 주요 리스트 끝에 하단 메뉴와 겹치지 않는 spacer 추가
- 채팅방 메시지 영역 중앙 하단에 낮은 투명도의 `맨 위로` 버튼 추가
- 채팅 전송 버튼 아이콘은 위쪽 화살표가 아니라 엔터키 느낌의 `↵`로 변경
- 중개사 매물 카드 클릭 시 상세 sheet 표시
- 직거래 매물 카드 클릭 시 상세 sheet 표시
- 중개사 매물에서도 매매+임차인 있음 매물은 `전세 승계` 또는 `임대 승계` 뱃지 표시
- 직거래 매물 목록에서도 매매+임차인 있음 매물은 `전세 승계` 또는 `임대 승계` 뱃지 표시
- 중개사 매물 상세에도 임차인 보증금/월세/만기/메모 표시
- 직거래 매물 상세에도 임차인 보증금/월세/만기/메모 표시
- 직거래 매물은 연락처 열람 후 `채팅 걸기` 가능
- 중개사/직거래 리스트에서는 가격추이를 직접 노출하지 않고 상세 sheet에서만 표시
- 중개사/직거래 상세 sheet에는 가격 조정 내역 표를 표시
- 매물 카드 좌측 상단 날짜는 등록일이 아니라 `updatedAgo` 기준의 `N일 전 수정함`으로 표시
- 중개사/직거래 정렬에 `추이 상승순`, `추이 하락순` 추가
- 필터 초기화 버튼 추가
- 지도 핀 선택도 필터 상태에 포함
- 거래 유형 필터 추가
  - 매물 분류에 맞는 거래 유형만 노출
- 중개사/직거래 매물 필터의 매물 분류와 거래 유형은 드롭다운 다중 선택 방식
- 중개사/직거래 매물 필터는 선택 즉시 목록을 바꾸지 않고 `필터 적용` 버튼을 눌러 반영
  - 예외: `열람목록`의 `즐겨찾기` 필터는 클라이언트 상태만 바꾸므로 즉시 반영
  - 백엔드 API 붙일 때도 매 클릭마다 서버 조회하지 말고 `필터 적용` 시점에 조회
- 직거래 매물 필터에 금액대 범위 슬라이더 추가
  - 임대/월세는 `priceNum` 보증금 기준
  - 슬라이더는 한 줄 range bar이고 선택 구간에 색을 표시
- 상태 필터 추가
  - `거래중만 보기`
  - `3일 이내 신규`
  - `만료 임박`
  - `완료 매물`
- 완료 매물은 30일 보관 기준으로 변경
- `만료 임박` 기준: 거래중이고 `expiresInDays <= 3`
- `3일 이내 신규` 기준: 거래중이고 `createdDaysAgo <= 3`
- 의뢰기한 표시를 카드 안에서 작게 보이도록 조정
- 위로 가기 버튼 추가
- 충전 팝업이 하단 메뉴와 겹치지 않도록 fixed sheet 구조로 변경
- 직거래 매수자도 현금 결제가 아니라 포인트 열람 구조로 변경
- 직거래 포인트 충전 보너스
  - `10,000P`: 보너스 없음
  - `30,000P`: 3%
  - `50,000P`: 5%
  - `100,000P`: 10%
- 빠른의뢰 정책
  - 중개사: 포인트 차감 후 연락처 즉시 공개, 이후 채팅 가능
  - 직거래 매수자: `10,000P` 차감 후 연락처 즉시 공개, 이후 채팅 가능
- 안심의뢰 정책
  - 중개사: 포인트 선차감 후 번호 비공개 채팅 신청
  - 직거래 매수자: `10,000P` 선차감 후 채팅으로 연락처 공개 요청
  - 소유주는 채팅방에서 `공개하기` 또는 `거절·자동 환불` 선택
  - 승인 시 포인트 사용 확정
  - 거절 또는 24시간 무응답 시 자동 환불
  - 현재 환불은 UI/문구 데모이며 실제 포인트 장부 반영은 백엔드 필요
- 직거래 매물 CTA 색상
  - `연락처 열람`: 금색
  - `연락처 공개 요청`: 초록색
- 중개사 포인트 충전 보너스
  - 무료: 0%
  - 실버: 5%
  - 골드: 10%
- 중개사 포인트 차감은 등급별 차이를 작게 유지
  - 무료: 빠른의뢰 `2,000P`, 안심의뢰 `1,000P`
  - 실버: 빠른의뢰 `1,900P`, 안심의뢰 `950P`
  - 골드: 빠른의뢰 `1,800P`, 안심의뢰 `900P`
- `Subscription.jsx` 설명도 위 정책으로 업데이트
- 소유주 `부동산` 메뉴 추가
- 부동산 카드는 팝업으로 리뷰/정보 확인
- 부동산 상세 팝업은 현재 화면 기준 `fixed` sheet로 뜨도록 수정
- 부동산 티어는 지역 내 상대평가 느낌으로 표시
  - `지역 대표 부동산`
  - `지역 파워 부동산`
  - `지역 우수 부동산`
  - `검증 부동산`
- 별점은 제외하고 리뷰만 표시
- 소유주가 부동산과 `계약 체결`을 누르는 데모 기능 추가
- 중개사 응답률 점수는 제거 방향
  - 현재는 `responseMode`, `workingHours`, `lastActive` 같은 표시 데이터 위주
- 매물 등록의 매물 종류별 거래 유형 정리
  - 아파트/빌라/단독주택/오피스텔: 매매/전세/월세
  - 상가: 매매/임대
  - 토지: 매매
  - 입주권: 권리양도
  - 분양권: 전매
  - 재개발·재건축: 권리양도
- 권리금/프리미엄 입력 반영
- 매물 의뢰에 상세 설명 입력 추가
- 매물 의뢰 필수 입력 추가
  - 공급면적
  - 전용면적
  - 해당층
  - 총층
  - 방수
  - 욕실수
  - 향
  - 입주가능일
- 매물 의뢰 선택 입력 추가
  - 융자금
  - 관리비
  - 주차
  - 복층 여부
  - 특이사항
- 직거래 노출 선택 영역에 계약서/권리관계/잔금/하자 분쟁 위험 안내 문구 추가
- 소유주/중개사/직거래 상세 sheet에 공급/전용, 층수, 방/욕실, 향, 복층, 입주가능일, 융자금, 관리비 표시
- 상세 sheet에는 `마지막 수정`도 표시
- 매물 의뢰에 임차인 보증금/월세/계약만기/협의사항 입력 추가
- 내 매물 리스트에서는 가격추이 표시를 제거
- 내 매물 상세에는 최초 등록 대비 가격추이와 가격 조정 내역을 날짜별로 표시
- 내 매물 상세에 `정보 수정` sheet 추가
  - 상세 설명
  - 공급/전용
  - 층수
  - 방/욕실
  - 향
  - 복층
  - 입주가능일
  - 융자금
  - 관리비
  - 주차
  - 특이사항
- 가격 변경 또는 정보 수정 시 `updatedAgo: "방금 전"`, `updatedReason` 갱신
- 매매 매물에 임차인이 있으면 리스트에는 `전세 승계` 또는 `임대 승계` 뱃지만 표시하고, 상세에서 보증금/월세/만기/메모를 확인
- 완료 라벨 반영
  - 매도완료
  - 전세완료
  - 임대완료
  - 양도완료
  - 전매완료

## 현재 데이터 상태

- `src/data/data.js`에 `PROPERTIES` 100개가 들어있다.
- 일부 매매 더미 매물에는 임차인 승계 정보가 자동 부여된다.
  - `tenant`
  - `tenantDeposit`
  - `tenantMonthly`
  - `tenantEnd`
  - `tenantMemo`
- 각 매물은 대략 다음 필드를 가진다.
  - `id`
  - `region`
  - `dong`
  - `complex`
  - `propType`
  - `dealType`
  - `price`
  - `priceNum`
  - `premium`
  - `area`
  - `floor`
  - `fee`
  - `fast`
  - `views`
  - `ago`
  - `x`
  - `y`
  - `badge`
  - `status`
  - `doneLabel`
  - `completedDaysAgo`
  - `expiresInDays`
  - `createdDaysAgo`
  - `priceHistory`
- 주의: 현재 `makePriceHistory` 때문에 기본적으로 모든 매물에 가격추이가 생성된다.
- 사용자는 “가격 추이를 다 넣지는 말자”라고 했으므로 다음 수정에서 일부 매물만 `priceHistory`를 갖도록 줄이는 것이 맞다.

## 현재 한계

- 실제 회원가입/로그인 없음
- 실제 백엔드 없음
- 설정은 `localStorage`라 브라우저/기기별로만 유지
- 알림은 실제 푸시 알림이 아니라 설정 UI만 있음
- 포인트 충전/차감은 데모 상태값
- 결제 연동 없음
- 채팅 응답률 산정 없음
- 중개사 가입 시 부동산 상세 정보 입력 플로우 없음
- 부동산 계약 체결/리뷰는 실제 거래 데이터와 연결되지 않은 데모
- 지역 필터 UI는 `광역시/도 → 시/군/구 → 읍/면/동` 형태지만, 현재 데이터는 서울 구/동 중심이다.
- 가격 추이는 실제 시세 데이터가 아니라 데모 `priceHistory` 기반이다.
- `package.json`이 없어 로컬 빌드 검증 불가

## 프론트에 임시로 들어간 백엔드 역할

현재는 프로토타입이라 프론트 상태값으로 처리해도 된다. 단, 실제 서비스로 가면 아래 항목은 백엔드가 맡아야 한다.

- 로그인/회원 유형
  - 현재: `accountType`, `role`, `availableRoles`를 프론트 상태로 처리
  - 백엔드 필요: 회원가입, 로그인, 세션, 권한, 중개사 계정 여부
- 중개사 인증/부동산 정보
  - 현재: `BROKER_OFFICES` 더미 데이터
  - 백엔드 필요: 등록번호, 사업자/중개사 검증, 사무소 주소, 전문 지역, 영업시간
- 설정 저장
  - 현재: `localStorage`에 `toad.preferredRegion`, `toad.interestRegion`, `toad.notifications` 저장
  - 백엔드 필요: 계정별 관심지역, 알림 설정, 기기 변경 후 동기화
  - 프론트 유지 가능: 마지막 선택값 캐시
- 매물 저장/수정
  - 현재: `properties` 상태, `PROPERTIES` 더미 데이터
  - 백엔드 필요: 매물 DB, 소유주 소유권, 상세 설명, 임차인 정보, 사진, 공개 상태
- 매물 검색/필터/정렬
  - 현재: `appliedFilters` 프론트 상태와 `PROPERTIES` 더미 데이터를 기준으로 필터링
  - 백엔드 필요: `필터 적용` 버튼 시점에 검색 API 호출, 페이지네이션, 정렬 인덱스, 지역/가격/유형 조건 처리
  - 주의: 필터 선택 클릭마다 서버 조회하지 않는다.
- 의뢰 기한/완료 상태
  - 현재: `expiresInDays`, `completedDaysAgo`, `createdDaysAgo` 숫자로 계산
  - 백엔드 필요: `createdAt`, `expiresAt`, `completedAt` 타임스탬프 기준 계산
- 가격 추이
  - 현재: `priceHistory` 배열을 프론트에서 추가
  - 백엔드 필요: 가격 변경 이력 테이블, 변경자, 변경시각, 변경 사유
- 열람/연락 기록
- 현재: `viewed`, `contacted`, `unlocked`, `contactDecisions` 상태
- 임시 캐시: `src/data/cache.js`에서 메모리 기반으로 `contactDecisions`를 저장
- 새로고침하면 임시 캐시는 초기화됨
- `contactDecisions`는 `App.jsx` 전역 state로 관리하지 않고 각 화면이 `src/data/cache.js` 메모리 캐시를 직접 읽고 쓴다.
- 캐시 키: `contactDecisions`, `viewedListings`, `favoriteListings`, `brokerProposals`, `buyerProposals`, `pointLedger`
  - 목적: 백엔드 구축 전까지 현재 실행 세션에서만 상태를 유지하고, 이후 API/DB 컬렉션 설계의 뼈대로 사용
  - 주의: 캐시는 보안 저장소가 아니므로 실제 연락처, 결제 승인값, 권한 정보는 저장하지 않는다.
  - 현재: 연락처는 매물의 `ownerPhone`이 없으면 `010-1234-5678` 더미값으로 표시
  - 중요: 실서비스에서 매물목록/상세 API 응답에는 실제 연락처를 절대 포함하지 않는다.
  - 빠른의뢰/직거래 연락처 열람은 결제 또는 포인트 차감 성공 후 별도 연락처 조회 API에서만 내려준다.
  - 안심의뢰는 소유주 승인 완료 후 별도 연락처 조회 API에서만 내려준다.
  - 백엔드 필요: 누가 언제 어떤 매물을 열람했는지, 연락처 열람권, 실제 소유주 연락처, 안심의뢰 승인/거절 상태, 중복 과금 방지, 연락처 조회 감사 로그
  - 승인/거절은 부동산 제안 팝업과 채팅방에서 같은 요청 상태를 공유해야 함
- 즐겨찾기
  - 현재: 중개사/직거래 매물 리스트의 `favorites` 프론트 상태
  - 백엔드 필요: 사용자별 즐겨찾기 저장, 해제, 목록 조회, 기기 간 동기화
- 포인트/결제/구독
  - 현재: `setPoints`, 등급별 보너스/차감 계산이 프론트에 있음
  - 백엔드 필요: 결제 승인, 포인트 장부, 보너스 지급, 차감, 안심의뢰 거절 환불, 구독 상태 검증
  - 이유: 프론트 포인트는 사용자가 조작 가능
  - 안심의뢰 장부 권장 상태: `pending`, `approved`, `rejected`, `expired`, `refunded`
  - 안심의뢰는 요청 시 차감 ledger를 만들고, 승인 시 확정, 거절/24시간 무응답 시 refund ledger를 추가
- 부동산 티어
  - 현재: 지역 내 상대평가 느낌의 더미 티어
  - 백엔드 필요: 지역별 계약 실적, 최근 활동, 리뷰 수, 제재 이력 기반 산정
- 계약 체결
  - 현재: `contractedId` 상태로 데모 처리
  - 백엔드 필요: 소유주-부동산-매물 계약 관계, 체결 시각, 리뷰 작성 권한
- 리뷰
  - 현재: 더미 텍스트 리뷰
  - 백엔드 필요: 실제 계약 체결 후 작성 가능, 신고/숨김/운영자 검수
- 채팅
  - 현재: 더미 `CHATS`
  - 백엔드 필요: 메시지 저장, 읽음/안읽음, 첨부파일, 차단/신고
- 알림
  - 현재: 설정 UI만 있음
  - 백엔드 필요: 새 매물, 만료 임박, 가격 변경, 채팅, 포인트 부족 푸시/문자/이메일
- 주소/지도
  - 현재: 주소 문자열에서 구/동 추출, 더미 좌표
  - 백엔드 필요: 주소 정규화, 좌표 변환, 행정구역 코드

## 프론트에 남겨도 되는 역할

- 화면 전환
- 탭/메뉴 선택 상태
- 필터/정렬 UI 상태
- 팝업 열림/닫힘
- 입력 중인 폼 draft
- 토스트 메시지
- 애니메이션
- 마지막 선택값 캐시
- 서버에서 받은 데이터를 보기 좋게 가공하는 표시 로직

## 백엔드 붙일 때 우선 설계할 테이블

- `users`
- `user_profiles`
- `broker_profiles`
- `broker_offices`
- `properties`
- `property_details`
- `property_tenants`
- `property_price_history`
- `property_media`
- `property_views`
- `contact_unlocks`
- `broker_applications`
- `contracts`
- `reviews`
- `point_wallets`
- `point_ledger`
- `subscriptions`
- `payments`
- `chats`
- `chat_messages`
- `notification_settings`
- `notifications`

## 다음 구현 우선순위

1. StackBlitz에서 현재 코드가 흰 화면 없이 뜨는지 확인
2. 홈, 중개사 홈, 직거래 홈에서 두꺼비가 온전히 보이는지 확인
3. `src/data/data.js`의 가격추이를 일부 매물에만 남기기
4. 지역 필터 데이터를 전국 3단 구조로 확장
   - 현재 UI는 `광역시/도 → 시/군/구 → 읍/면/동` 형태
   - 현재 데이터는 서울특별시 중심
   - 실제 서비스에서는 행정구역 코드 기반 데이터 필요
5. 중개사 가입/설정 플로우 만들기
   - 부동산명
   - 대표자/중개사명
   - 등록번호
   - 사무소 주소
   - 전문 지역
   - 전문 매물 유형
   - 연락 가능 시간
   - 채팅/전화 선호 여부
6. 소유주가 계약 체결 후 리뷰 남기는 흐름 만들기
   - 별점 없음
   - 텍스트 리뷰만
   - 허위 리뷰 방지용 거래 연결 필요
7. 포인트 장부 만들기
   - 충전
   - 보너스
   - 차감
   - 환불/취소
   - 열람 기록
8. 실제 백엔드 선택
   - Supabase
   - Firebase
   - Vercel API + DB
9. 실제 데이터 영속화
   - 사용자
   - 역할/계정 유형
   - 매물
   - 문의/열람
   - 채팅
   - 포인트
   - 부동산 카드
   - 리뷰
10. 프론트에 있는 임시 백엔드 로직을 서버 API로 교체
    - `localStorage` 설정 저장
    - 포인트 충전/차감
    - 연락처 열람
    - 계약 체결
    - 리뷰 작성 권한
    - 가격 변경 이력
    - 매물 기한 계산
11. Vercel 배포 후 모바일 화면 QA
    - 홈 헤더
    - 필터 영역
    - 충전 팝업
    - 카드 클릭
    - 지도 핀
    - 하단 메뉴와 팝업 겹침

## StackBlitz 콘솔 확인 기준

- 무시해도 되는 경우가 많음
  - `Failed to load message bundle for language ko-KR`
  - `CORS policy` 관련 StackBlitz extension/gallery 요청
  - `node: bad option`
  - `ExperimentalWarning: WASI`
  - `A listener indicated an asynchronous response...`
- 우선 고쳐야 하는 에러
  - `Uncaught ReferenceError`
  - `Failed to resolve import`
  - `does not provide an export named`
  - `Unexpected token`
  - `Failed to reload /src/...`

## 작업 원칙

- 큰 파일 전체 교체보다 작은 파일 단위로 수정
- `src/assets/toad.png` 삭제 금지
- 두꺼비 스프라이트는 `src/frogSprite.js`의 PNG import 유지
- StackBlitz에서 수정했다면 반드시 `Create & Push`
- GitHub에서 직접 수정했다면 StackBlitz가 최신 커밋을 기준으로 열렸는지 확인
- 용어는 `탭`과 `메뉴`를 구분해서 사용
## 추가 인계: 새롭게 제안한 기준

- 소유주 홈 `새롭게 제안한 부동산`은 현재 `INTEREST_BROKERS`의 `proposalNew: true` 데모 플래그 기준이다.
- 소유주 홈 `새롭게 제안한 직거래 매수자`는 현재 `DIRECT_BUYERS`의 `proposalNew: true` 데모 플래그 기준이다.
- 현재는 실제 시간 계산이나 확인 여부 저장이 아니다.
- 현재는 사용자가 목록을 눌러 확인해도 `proposalNew`가 자동으로 false로 바뀌지 않는다.
- 백엔드 필요:
  - 제안 생성 시각 `createdAt`
  - 사용자별 확인 시각 `seenAt`
  - 제안 상태 `proposalStatus`
  - 사용자/매물/제안자 연결 `userId`, `listingId`, `actorId`
  - `seenAt`이 없거나 `createdAt > seenAt`이면 새 제안으로 계산
  - 소유주가 제안 목록을 열람하면 해당 제안의 `seenAt` 갱신
## 추가 인계: 설정 계정 하위 페이지

- `src/components/Settings.jsx`의 계정 메뉴 3개는 하위 페이지로 분리했다.
  - `프로필`
  - `포인트/결제`
  - `고객지원`
- 현재 하위 페이지 값은 프론트 데모 데이터다.
- 백엔드 필요:
  - 프로필: 사용자 이름, 연락처, 현재 역할, 사용 가능 역할
  - 포인트/결제: 보유 포인트, 결제수단, 충전 내역, 사용 내역, 구독 등급
  - 고객지원: 문의 접수, 신고 접수, 약관/개인정보 문서 조회
- 실제 서비스에서는 계정 API, 결제 API, 고객지원 API와 연결해야 한다.
## 추가 인계: 중개사 설정 하위 페이지

- `src/components/Settings.jsx`의 중개사 설정 메뉴 3개는 하위 페이지로 분리했다.
  - `부동산 정보`
  - `영업시간`
  - `전문 지역`
- 현재 하위 페이지 값은 프론트 데모 데이터다.
- 백엔드 필요:
  - 부동산 정보: 상호, 대표/중개사명, 등록번호, 사무소 주소, 연락처, 검증 상태
  - 영업시간: 요일별 시작/종료 시간, 휴무일, 응답 선호 채널, 응답 가능 상태
  - 전문 지역: 주력 지역, 확장 지역, 전문 매물 유형, 노출 우선순위, 구독 등급
- 실제 서비스에서는 `broker_profiles`, `broker_offices`, `broker_service_regions`, `broker_business_hours` 같은 테이블/API와 연결해야 한다.
## 추가 인계: 구독/포인트 결제 UI

- `src/components/Subscription.jsx`에 구독 결제 흐름을 추가했다.
  - 구독 등급 선택
  - 외부 결제 전 확인 화면
  - 결제수단 선택 UI
  - 결제 완료 화면
- `src/components/Settings.jsx`의 `계정 > 포인트/결제`에 포인트 결제 흐름을 추가했다.
  - 보유 포인트/구독 등급 요약
  - 포인트 충전 상품 선택
  - 외부 결제 전 확인 화면
  - 결제수단 선택 UI
  - 결제 완료 화면
- 현재 결제 완료는 프론트 데모 상태다. 실제 외부 결제 호출은 없다.
- 백엔드 필요:
  - 결제 준비 API
  - 외부 결제 승인 콜백/API
  - 결제 성공/실패/취소 상태 저장
  - 포인트 지급 ledger
  - 구독 등급 변경
  - 영수증/거래번호 저장
  - 중복 결제 방지용 `paymentIntentId` 또는 `merchantUid`
- 실제 서비스에서는 외부 결제 완료 콜백 성공 후에만 포인트 지급과 구독 변경을 확정해야 한다.
## 추가 인계: 설정/구독 백엔드 연결 준비

- `src/components/Settings.jsx`
  - 하위 페이지 진입 시 항상 상단부터 보이도록 `scrollIntoView` 처리했다.
  - `계정 > 프로필`은 수정 가능한 입력 폼으로 바꿨다.
  - 현재 저장 버튼은 프론트 데모다.
  - 백엔드 필요:
    - `PATCH /me/profile`
    - 필드: `name`, `phone`, `email`, `availableRoles`
    - 전화번호 인증, 이메일 중복 확인
  - `계정 > 고객지원`은 한 화면에서 아래 기능을 처리하도록 바꿨다.
    - 문의하기
    - 신고하기
    - 이용약관
    - 개인정보 처리방침
  - 백엔드 필요:
    - 문의 접수 API
    - 신고 접수 API
    - 약관 문서 조회 API
    - 개인정보 처리방침 문서 조회 API
- `src/components/Subscription.jsx`
  - 구독 결제는 외부 결제가 아니라 보유 포인트 차감 방식으로 바꿨다.
  - 등급 선택만으로 `brokerTier`가 바뀌지 않고, `포인트로 구독하기` 완료 시점에만 반영된다.
  - 백엔드 필요:
    - 구독 신청 API
    - 포인트 잔액 검증
    - 포인트 차감 ledger
    - 구독 등급 변경 트랜잭션
    - 중복 신청 방지용 요청 id
- 앱 뒤로가기 기준:
  - 단독 `←` 대신 `← 계정`, `← 중개사 설정`, `← 채팅`, `← 내 매물`, `← 이전`처럼 돌아갈 위치를 표시한다.
## 정정 인계: 구독 결제 방식

- 구독은 월 자동 결제가 필요하므로 포인트 차감 방식으로 처리하면 안 된다.
- `src/components/Subscription.jsx`는 다시 외부 정기결제 확인 UI로 되돌렸다.
- 포인트는 매물 연락처 열람, 안심의뢰 신청, 포인트 충전 보너스 등에만 사용한다.
- 구독 등급은 등급 선택만으로 바뀌지 않고, 외부 정기결제 성공 후에만 반영해야 한다.
- 백엔드 필요:
  - 정기결제 빌링키 등록
  - 월 자동 결제 스케줄
  - 결제 성공/실패/해지 상태
  - 구독 등급 변경 트랜잭션
  - 결제 영수증/거래번호 저장
  - 결제 실패 시 등급 유지/강등 정책
- 주의:
  - 이전 인계의 `구독은 보유 포인트 차감 방식` 내용은 폐기한다.
## 추가 인계: Supabase listings 읽기 연결

- `src/supabaseClient.js`를 추가했다.
- `src/App.jsx`에서 `listings` 테이블을 읽는다.
- `listings` 결과가 빈 배열이면 기존 데모 `PROPERTIES`를 유지한다.
- `listings`에 데이터가 있으면 `normalizeListing`으로 화면용 매물 객체로 바꿔 `properties` 상태에 넣는다.
- 현재는 읽기만 연결했다.
- 현재는 생성/수정/삭제 API를 붙이지 않았다.
- 현재 매핑은 프론트 호환용 임시 매핑이다.
- 백엔드 컬럼 권장:
  - `id`
  - `region`
  - `dong`
  - `complex`
  - `prop_type`
  - `deal_type`
  - `price`
  - `price_num`
  - `premium`
  - `area`
  - `floor`
  - `fee`
  - `fast`
  - `views`
  - `status`
  - `done_label`
  - `completed_days_ago`
  - `expires_in_days`
  - `created_days_ago`
  - `price_history`
  - `supply_area`
  - `exclusive_area`
  - `total_floor`
  - `room_count`
  - `bath_count`
  - `move_in_date`
  - `description`
  - `maintenance`
  - `parking`
  - `direction`
  - `special`
  - `tenant`
  - `tenant_end`
  - `tenant_deposit`
  - `tenant_monthly`
  - `tenant_memo`
- 다음 백엔드 연결 순서:
  1. `listings` seed 데이터 1건 넣고 화면 반영 확인
  2. 매물 등록 `insert`
  3. 내 매물 수정 `update`
  4. 거래완료/기한연장 `update`
  5. 가격변경 이력 별도 테이블 분리
## 추가 인계: listings 컬럼 확장

- 현재 Supabase `listings`는 처음에 `id`, `title`, `price`, `address`, `created_at`만 있었다.
- 앱 표시용으로 `src/App.jsx`의 `normalizeListing`을 보강했다.
  - `price_label`, `price_text`, 숫자 `price` 모두 처리 가능
  - 숫자 `price`는 `${price}만` 형태로 표시
- 권장 확장 컬럼은 아래 SQL 기준이다.
- `price` 기존 숫자 컬럼은 유지하고, 앱용 표시 문자열은 `price_label`에 둔다.
## 추가 인계: listings insert 연결

- `src/App.jsx`에서 `의뢰하기` 완료 시 Supabase `listings`에 insert하도록 연결했다.
- `listingToInsertRow`를 추가했다.
- DB `id`는 `bigint generated always as identity`라 프론트에서 보내지 않는다.
- insert 성공 시 Supabase가 반환한 row를 `normalizeListing`으로 변환해서 화면에 반영한다.
- insert 실패 시 콘솔에 `Supabase insert listing error`를 찍고, 기존처럼 프론트 메모리 상태에만 임시 반영한다.
- 현재 RLS가 select만 있으면 insert는 실패한다.
- Supabase에 insert 정책 필요:
  - 지금 로그인/auth 전이면 anon insert 허용 정책으로 테스트 가능
  - 실제 서비스에서는 auth 붙인 뒤 `owner_id = auth.uid()` 기준으로 제한해야 한다.
## 추가 인계: listings update 연결

- `src/App.jsx`에서 내 매물 수정 관련 update를 Supabase에 연결했다.
  - 가격 변경
  - 매물 정보 수정
  - 거래 완료/되돌리기
  - 의뢰 기한 2주 연장
- `listingPatchToRow`를 추가했다.
- update 실패 시 콘솔에 아래 에러를 찍고 프론트 상태는 임시 반영한다.
  - `Supabase update listing status error`
  - `Supabase extend listing term error`
  - `Supabase update listing price error`
  - `Supabase update listing info error`
- Supabase에 update 정책과 누락 컬럼이 필요하다.
- 현재 로그인/auth 전이므로 개발용 `anon update` 정책으로 테스트한다.
- 실제 서비스에서는 `owner_id = auth.uid()` 기준으로 update 권한을 제한해야 한다.

## 추가 인계: 테스트 아이디/채팅 데모 분리

- `src/data/demoUsers.js`의 테스트 아이디 선택값은 `localStorage`의 `toad.demoOwnerKey` 기준이다.
- 설정에서 테스트 아이디를 바꾸면 프론트 역할도 해당 아이디의 `role`로 강제 변경한다.
  - 소유주 아이디: 소유주 메뉴만 노출
  - 중개사 아이디: 중개사 메뉴만 노출
  - 직거래 아이디: 직거래 메뉴만 노출
- 현재 역할 제한은 프론트 데모 로직이다. 백엔드에서는 로그인 사용자 권한/역할 테이블 기준으로 대체해야 한다.
- `src/components/MyList.jsx`의 소유주 A/B 데모 매물은 프론트 임시 데이터다.
  - 소유주 A: 기존 공덕/잠실 매물
  - 소유주 B: 대치/역삼 매물
- `src/components/common.jsx`의 `ListSheet`는 `viewerKey`로 소유주 A/B의 제안 부동산/직거래 매수자 목록을 다르게 보여준다.
- `src/components/Chat.jsx`에 `demo-test-chat` 테스트 채팅방을 추가했다.
  - 모든 테스트 아이디가 같은 `thread_id = demo-test-chat`을 사용한다.
  - 메시지는 Supabase `chat_messages`에 저장된다.
  - 실제 서비스에서는 `chats`, `chat_participants`, `chat_messages`를 사용자 권한 기준으로 조회해야 한다.
- 새로고침하면 `src/data/cache.js` 메모리 캐시는 초기화된다.

## 추가 인계: listings 임시 소유자 키

- GitHub `main`의 `src/App.jsx`에 임시 소유자 키를 추가했다.

```js
const OWNER_KEY = "toad-demo-owner";
```

- 새 등록 매물에는 `owner_key = "toad-demo-owner"`를 저장한다.
- Supabase에서 읽은 row의 `owner_key`가 `OWNER_KEY`와 같으면 `mine: true`로 변환한다.
- DB에 `owner_key` 칼럼이 없으면 insert 실패를 피하려고 `owner_key`를 뺀 fallback insert를 한다.
- fallback insert는 등록은 되지만 새로고침 후 `내 매물`로 유지되지 않는다.
- Supabase 필수 SQL:

```sql
alter table listings
add column if not exists owner_key text;
```

- 실제 로그인 붙일 때는 `owner_key`를 Supabase Auth `user.id` 기반 `owner_id`로 교체해야 한다.

## 추가 인계: GitHub main 의존성

- GitHub `main`의 `package.json`에 `@supabase/supabase-js`를 추가했다.
- `package-lock.json`은 아직 갱신되지 않았다.
- StackBlitz에서 `npm install`을 실행하면 lockfile이 갱신된다.

## 추가 인계: Supabase Realtime 채팅 설정

- `src/components/Chat.jsx`는 `chat_messages` INSERT를 Supabase Realtime `postgres_changes`로 구독한다.
- 채팅방 내부와 채팅 목록 마지막 메시지 모두 INSERT 이벤트로 갱신한다.
- Supabase에서 `chat_messages` 테이블이 Realtime publication에 포함되어야 실시간 반영된다.
- 필요 SQL:

```sql
alter publication supabase_realtime add table public.chat_messages;
```

- 이미 추가된 테이블이면 위 SQL은 중복 오류가 날 수 있다.
- RLS는 최소 개발용으로 `select`, `insert` 정책이 있어야 한다.
- 실제 서비스에서는 `chat_participants` 기준으로 본인 참여 채팅만 `select/insert` 가능하게 제한해야 한다.

## 추가 인계: 채팅 상대 프로필 UI

- `src/components/Chat.jsx`의 채팅방 헤더 오른쪽 상대 정보 묶음을 누르면 상대 프로필 sheet가 열린다.
- 현재 프로필 데이터는 `chatPartnerProfile` 프론트 데모 계산값이다.
- 실제 서비스에서는 `chats`, `chat_participants`, `user_profiles`, `broker_profiles`, `broker_offices`를 조인해서 상대 프로필을 내려줘야 한다.
- 테스트 채팅방은 `테스트 아이디 전체`를 상대 프로필로 표시한다.
