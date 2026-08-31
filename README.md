# 포인핸드 웹 리뉴얼

유기동물 입양 플랫폼 **포인핸드**를 바닐라 JavaScript로 리뉴얼한 개인 포트폴리오입니다.
공공데이터포털 유기동물 조회 API를 연동해 실시간 공고를 조회하고, 검색·필터·지도·상세 페이지를 구현했습니다.

## 데모

(동물검색 페이지 / 동물상세 페이지)
<video src="https://github.com/user-attachments/assets/50b07d9c-4495-4a85-bd2b-749bc4a62fc4" autoplay loop muted playsinline width="100%"></video>
*(브라우저 자동재생 정책으로 재생되지 않으면 컨트롤러를 눌러주세요.)*

## 페이지별 기능

| 페이지 | 주요 기능 |
|---|---|
| **index** | 히어로 배너 · 지역별 추천동물 필터(API `orgNm` 집계) · 베스트 후기 · 소식 배너 슬라이더 · 실종/제보 · 기부 챌린지 · 유기동물 현황 미니 대시보드 |
| **search** | 실시간 키워드 검색(품종/지역/특징) · 상태 필터 · 최신/오래된순 정렬 · 더보기 페이지네이션 · 찜하기(localStorage) · 캠페인 소식 카드(→ news) |
| **detail** | 공고번호(`?num=`) 기반 상세 조회 — sessionStorage 캐시 우선, 없으면 목록 조회로 폴백 · 이미지 갤러리 · 성격/입양 절차 · 댓글(localStorage) |
| **shelter** | 오늘의 추천 입양 동물 · 전체 보호동물 2열 그리드 · 조건 필터 모달 · 카카오맵 보호소 마커(주소→좌표 지오코딩) |
| **news** | 캠페인·이벤트 소식 (search 소식 카드에서 진입) |
| **login / signup** | 회원가입(ID 중복·비밀번호 8자 규칙·확인 일치 검증) · 로그인(가입 계정 대조) · 체험 계정 즉시 로그인 · 폼 인라인 오류 표시 · localStorage 세션 유지 (프론트 전용 데모) |

## 아키텍처

- **디자인 토큰**: `css/common.css` `:root` 에 색상·타이포·간격·모서리·그림자를 CSS Custom Properties로 정의, 전 페이지 일괄 관리
- **버튼 시스템**: `.btn` + 변형(`--primary` / `--ghost` / `--chip` / `--text`)으로 페이지마다 제각각이던 버튼을 하나로 통합
- **공통 UI 헬퍼** (`js/ui.js`): 로딩 스켈레톤, 빈/에러 상태 메시지, 토스트 알림, 이미지 로드 실패 폴백, 헤더 현재 페이지 표시, 동물 데이터 캐시
- **API 레이어 분리** (`js/api.js`): fetch·예외 처리·응답 파싱을 페이지 로직과 분리
- **데이터 캐시**: 목록 페이지가 받은 API 원본을 `sessionStorage`(`animalCache`)에 공고번호 키로 저장 → 상세 페이지에서 재요청 없이 사용

## 디렉토리 구조

```text
📦 lym-bin.github.io
 ┣ 📂 css        # common(토큰·버튼·공통) + 페이지별
 ┣ 📂 js         # config / api / ui + 페이지별 스크립트
 ┣ 📂 images
 ┣ 📄 index.html / search.html / detail.html / shelter.html / news.html / login.html / signup.html
 ┣ 📄 .gitattributes
 ┗ 📄 .gitignore
```

## 트러블슈팅 / 주요 고민

### 1. 보호소 지도 탭이 조용히 먹통 (에러도 안 남)
카카오맵 SDK를 `autoload=false` 로 불러오는데, `kakao.maps.services` 는 `kakao.maps.load()` 콜백 이후에야 생성됩니다.
그런데 로드 대기 조건에서 `kakao.maps.services` 존재 여부를 검사해 `load()` 호출에 영영 도달하지 못하고 `setTimeout` 이 무한 반복됐습니다.
→ 대기 조건을 `kakao.maps.load` 존재 여부로 바꾸고, 나머지 로직을 콜백 안으로 이동. 재시도 상한(25회)을 둬서 SDK 로드 실패 시 안내 문구를 노출.

### 2. 통계 수치가 "비율"이 아니라 "마리 수"
통계 API(`rescueAnimalStats`)의 `tot` 값을 그대로 `%` 로 표기하고 있었습니다. 실제로는 처리상태별 **마리 수**(보호중 / 입양 / 반환 / 자연사 / 안락사 …)였고, `numOfRows` 기본값(10)에 6개 항목 중 일부가 잘리기도 했습니다.
→ `numOfRows=50` 으로 올리고 6개 항목을 모두 파싱. "보호 종료 결과" 는 종료 건 총합 대비 실제 비율을 계산해 스택 바로 시각화.

### 3. 모바일 가로 스크롤
푸터 4단 메뉴(`.nav-list`)가 좁은 화면에서 줄바꿈 없이 펼쳐져 `documentElement.scrollWidth` 가 뷰포트를 63px 초과했습니다.
→ 원인을 Puppeteer 로 요소별 `getBoundingClientRect` 를 찍어 특정한 뒤, 모바일에서 2열로 접히도록 수정.

### 4. 상세 페이지 조회 최적화
유기동물 API가 `desertionNo` 단건 조회를 지원하지 않아(파라미터를 줘도 목록 반환), 처음엔 상세 페이지마다 전체 목록(1,000건)을 받아 `find()` 했습니다.
→ 목록 페이지(search / shelter / index)가 받은 원본을 `sessionStorage` 에 캐시하고, 상세 페이지는 캐시를 먼저 확인. 목록 → 상세 이동 시 네트워크 요청이 사라지고, 새로고침·직접 URL 접근에만 목록 조회로 폴백합니다.

### 5. 비동기 렌더링 체감 성능
대량 데이터를 받는 동안 화면이 비어 보이는 문제를 해결하기 위해, `async/await` 대기 구간에 스켈레톤 카드를 먼저 렌더하고 초기 노출 개수를 제한(`displayLimit`)했습니다.

### 6. 댓글 XSS 방지
localStorage 댓글을 `innerHTML` 템플릿으로 렌더하고 있어 `<img onerror>` 같은 입력이 실행될 수 있었습니다.
→ `createElement` + `textContent` 로 변경해 사용자 입력이 항상 텍스트로만 그려지도록 했습니다.

### 7. 백엔드 없는 회원가입/로그인
서버가 없어 회원 정보를 `localStorage`(`pawinhandUsers`)에 저장합니다. 비밀번호는 데모 목적상 평문으로 두었습니다 — 클라이언트에만 저장되는 값이라 해시를 걸어도 보안상 의미가 없고, 오히려 "서버·HTTPS·단방향 해시가 전제"라는 점을 분명히 하기 위한 선택입니다.
→ 가입 시 ID 중복/비밀번호 규칙을 검증하고, 로그인은 저장된 계정과 대조합니다. 실제 인증 플로우(토큰 발급·세션)는 재현하지 않았습니다.

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: CSS Custom Properties, Flexbox, Grid, 반응형(모바일·태블릿·데스크톱)
- **API**: 공공데이터포털 유기동물 조회 Open API, 카카오 지도 API(geocoding)
- **저장소**: localStorage(찜 / 댓글 / 로그인 세션 / 회원 정보), sessionStorage(동물 데이터 캐시)
- **환경**: Git, GitHub, GitHub Pages

## 배포

- **상태**: 배포 예정 (현재 로컬 환경 실행)

---

> **API 키**: `js/config.js` 는 의도적으로 커밋되어 있습니다.
> GitHub Pages 는 빌드 단계가 없어 배포 시 키 주입이 불가능하고, 사용된 키는 공공데이터 유기동물 조회 및
> 카카오 지도(도메인 제한 적용) 용도라 포트폴리오 운영 기간 동안 노출을 감수하는 방식으로 운영합니다.

> **이미지·에셋**: 비공식 리뉴얼 습작입니다. 배너/그래픽은 직접 제작, 카드용 동물 사진(후기·기부·실종/제보)은
> AI 생성, 유기동물 목록/상세 사진은 공공데이터 API 제공분입니다. 로고·아이콘·지역 썸네일은 원본 서비스에서
> 추출해 레이아웃 재현에 사용했으며, '포인핸드' 명칭 및 브랜드 자산의 권리는 주식회사 포인핸드에 있습니다.
> (아이콘 일부 Font Awesome Free)
