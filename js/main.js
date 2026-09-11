// js/main.js

/**
 * ======================================================================
 *  [포인핸드 메인 페이지 메인 로직 (main.js)]
 * ======================================================================
 * - 역할: api.js가 서버에서 받아온 날것의 데이터를 넘겨받아, 사용자가 보기 좋게
 *         실시간 웹 페이지(HTML DOM)에 동적으로 그려주는(렌더링) main 스크립트.
 * - 주요 특징:
 *   1. 비동기 통신(async/await)으로 데이터를 안전하게 기다렸다가 처리.
 *   2. 스코프(Scope) 개념을 통해 함수별로 독립적인 변수 공간을 유지.
 *   3. 방어 코드를 적용하여 데이터가 없거나 에러가 나도 앱이 멈추지 않게 설계.
 * ======================================================================
 */

/**
 *  [핵심 용어: DOMContentLoaded 이벤트]
 * - 웹 브라우저가 HTML 뼈대를 전부 읽고 그릴 준비가 끝났을 때 안전하게 코드를 실행시켜 주는 이벤트.
 * - 이 이벤트 안에서 비동기 함수(async)를 선언하여 화면 제어 로직을 시작.
 */

/** A: 슬라이더 : IIFE로 함수 즉시 실행 : 소식 배너 순환
 *  B: 날짜: DOMload시 : 통계 제목에 오늘 날짜
 *  C: 통계: DOMload시 + await : 타일 3개 + 스택바 렌더링
 *  D: 추천동물: DOMload시 + await : 카드목록 + 지역필터
 *  E: 베스트후기: DOMload시 : 더미카드 + 호버 전환
 *  F: 더보기/기부 챌린지: 최상위(즉시실행) : 버튼이동 + 프로그레스 카드
 */
// ==========================================
// 포인핸드 소식 슬라이더 (배너 순환)
// ==========================================
// 즉시 실행함수 괄호로 함수 감싸줌
(function newsSlider() {
  const slider = document.querySelector("#news-slider");
  if (!slider) return; // 슬라이더 없는 페이지면 종료

  const track = slider.querySelector(".news-track");
  const slides = slider.querySelectorAll(".news-slide");
  let index = 0; // 현재 몇 번쨰 슬라이드 (let - 바뀜)

  //  슬라이드 무한 순환 로직
  // slides.length : 슬라이드 전체 장수
  // i: > 버튼을 누르면 현재 index에 1을 더해서 던져줌
  // % : 왼쪽 숫자를 오른쪽숫자로 나눴을 때 나머지 결과를줌
  // 1- 넣으면 마지막, 개수 넘으면 처음으로
  // slide 3개, i= -1 > (-1+3)%3 = 2(마지막)
  function go(i) {
    index = (i + slides.length) % slides.length;
    // index 2면 -200%
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  slider
    .querySelector(".news-prev")
    // 클릭 시 index(현재 슬라이드)에서 -1 값
    .addEventListener("click", () => go(index - 1)); // 이전 버튼
  slider
    .querySelector(".news-next")
    .addEventListener("click", () => go(index + 1)); // 다음 버튼

  // 5초 자동 넘김 (마우스 올리면 정지)
  let timer = setInterval(() => go(index + 1), 5000); // 5초마다 자동 다음
  // 마우스 올리면 정지
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  // 떼면 실행
  slider.addEventListener("mouseleave", () => {
    timer = setInterval(() => go(index + 1), 5000);
  });
})();

// 웹 페이지의 HTML(DOM)이 모두 로드 완료되면 실행
document.addEventListener("DOMContentLoaded", async () => {
  // -------------------------------------------------------------
  // [1단계] 화면 왼쪽에 오늘 날짜 유기동물 통계 텍스트 설정
  // -------------------------------------------------------------
  // "today 객체에서 정보를 꺼내와서, yy, mm, dd라는 재단된 글자 조각을 만든 뒤, 화면에 꽂아 넣는다"
  const today = new Date(); // 오늘 날짜의 모든정보가 담긴 객체 생성
  // string으로 문자열로 변환 시킨 후 4자리 연도에서 2자리를 꺼내온다 2026 > 26
  // slice(2)는 앞에서 두개를 자르고 뒤에만 가져옴.
  const yy = String(today.getFullYear()).slice(2);
  // 날짜 객체에서 월 정보를 가져옴 javascript는 0부터 1임
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  // 날짜 객체에서 오늘이 몇일인지 가져옴.
  const dd = String(today.getDate()).padStart(2, "0");
  // html에서 날짜를 표시할 요소인 id가져오기.
  const statsDateEl = document.querySelector("#stats-date");
  // stats-date라는 아이디를 가진 html태그가 안전하게 존재한다면
  if (statsDateEl) {
    statsDateEl.textContent = `${yy}.${mm}.${dd} 유기동물 현황`;
  }

  // -------------------------------------------------------------
  // [2단계] 통계 + 유기동물 목록 API를 동시에 요청 (직렬 → 병렬)
  // -------------------------------------------------------------

  // 목록 컨테이너와 스켈레톤을 먼저 잡아둠 (두 API 응답 대기 동안 표시)
  const listContainer = document.querySelector("#today-dummy");
  showSkeleton(listContainer, 5); // 두 API 기다리는 동안 스켈레톤 먼저

  // 두 함수를 await 없이 호출 → 요청이 동시에 나감.
  // Promise.all: 둘 다 끝나면 결과를 배열로 반환. 대기시간 = 둘 중 느린 쪽.
  // (각 함수는 내부에서 실패해도 []를 반환하므로 Promise.all이 reject되지 않음)
  const [statsData, allAnimalData] = await Promise.all([
    fetchAnimalStats(), // 요청 나감 (안 멈춤)
    fetchAnimalsList(100), // 요청 나감 (안 멈춤) -> 겹쳐서 동시 진행. 100건으로 응답·이미지 로딩 단축
  ]);

  // statsData 있을때만 실행
  if (statsData && statsData.length > 0) {
    // chart1 = 처리상태별 "마리 수" (보호중 / 자연사 / 입양 / 기증 / 반환 / 안락사)
    // 주의: tot 값은 비율(%)이 아니라 마리 수. 예전엔 %로 잘못 표기했음.
    // filter 메서드로 chart1만
    const chart1 = statsData.filter((item) => item.se === "chart1");

    // --- find 메서드 이름으로 마리수 꺼내는 헬퍼 ---
    const countOf = (name) => {
      const hit = chart1.find((item) => item.prcsNm === name);
      // -- 찾았으면 tot을 숫자로(문자로 옴), NaN이면 0, 못찾으면 0
      return hit ? Number(hit.tot) || 0 : 0;
    };

    // 각 상태별 마리 수
    const care = countOf("보호중");
    const adopt = countOf("입양");
    const ret = countOf("반환");
    const donate = countOf("기증");
    const natural = countOf("자연사");
    const eol = countOf("안락사");

    // --- 핵심 수치 타일 3개 채우기 ---
    const setNum = (id, n) => {
      const el = document.querySelector("#" + id);
      if (el) el.textContent = n.toLocaleString();
    };
    setNum("statCare", care);
    setNum("statAdopt", adopt);
    setNum("statEol", eol);

    // --- 보호 종료 결과 스택 바 (보호중 제외, 종료 5개 항목 비율) ---
    // segments 박스에 객체 배열로 설정
    const segments = [
      { name: "입양", value: adopt, color: "#007bff" },
      { name: "반환", value: ret, color: "#17a2b8" },
      { name: "기증", value: donate, color: "#6f42c1" },
      { name: "자연사", value: natural, color: "#868e96" },
      { name: "안락사", value: eol, color: "#fd7e14" },
    ];

    // reduce: 배열 안의 모든 요소를 돌면서 값을 하나로 누적할 때 사용
    // 누적상자(sum)의 시작값을 0으로 두고 각 항목(s)의 s.value를 더해줌
    const endedTotal = segments.reduce((sum, s) => sum + s.value, 0);
    const barEl = document.querySelector("#statsBar");
    const legendEl = document.querySelector("#statsLegend");

    // 태그들이 존재하고 0보다 클 때 실행
    if (barEl && legendEl && endedTotal > 0) {
      // filter와 map으로 순차적으로 돌면서 막대 그래프 그리기
      barEl.innerHTML = segments
        // filter값 s.value가 0 보다 큰 값만 잡아줌
        .filter((s) => s.value > 0)
        // 0 보다 큰 데이터들 map으로 렌더링작업(span태그에 문자열반환)
        .map(
          (s) =>
            `<span class="seg" style="width:${((s.value / endedTotal) * 100).toFixed(2)}%;background:${s.color}" title="${s.name} ${s.value.toLocaleString()}마리"></span>`,
        )
        .join("");

      // filter를 거치지 않고 map으로 모든항목 돌기 범례(legend)만들기
      //
      legendEl.innerHTML = segments
        .map((s) => {
          const pct = ((s.value / endedTotal) * 100).toFixed(1);
          return `<li><span class="dot" style="background:${s.color}"></span>${s.name} <strong>${pct}%</strong></li>`;
        })
        .join("");
    }
  }

  // -------------------------------------------------------------
  // [3단계] 유기동물 추천 및 지역 버튼 연동 (API 데이터 필터링))
  // -------------------------------------------------------------

  // 데이터를 받아와서 화면에 카드형태로 렌더링하는 함수
  function renderAnimals(data) {
    // 리스트 컨테이너 없으면 종료
    if (!listContainer) return;
    // 재 렌더 할꺼라 비워둠
    listContainer.innerHTML = "";

    // 데이터가 아에 없을 때의 방어코드
    if (!data || data.length === 0) {
      showStateMessage(
        listContainer,
        "해당 지역에 등록된 동물 데이터가 없습니다.",
      );
      return;
    }

    // 상단 지역칩과 열을 맞춰 5개(5열)만 노출
    const limitedData = data.slice(0, 5);

    listContainer.innerHTML = limitedData
      // 괄호 열어서 rerurn값 생략안함
      .map((animal) => {
        const kind = animal.kindNm || animal.kindCd || "품종 정보 없음";
        const sex =
          // 삼항 중첩문 (= else if)
          animal.sexCd === "M"
            ? "수컷"
            : animal.sexCd === "F"
              ? "암컷"
              : "미상";
        const age = animal.age || "나이 미상";
        const img = animal.popfile1 || animal.popfile2 || "";
        const desertionNo = animal.desertionNo || "";
        // 백틱으로 카드 마크업 공고번호로 전달
        // loading="lazy"로 이미지로드 속도 업
        return `
        <li>
        <a href="detail.html?num=${desertionNo}">
        <img src="${img}" alt="${kind}" loading="lazy" onerror="imgError(this)">
        <span class="card-species">${kind}</span>
        <span class="card-meta">${sex} · ${age}</span>
        </a>
        </li>
      `;
      })
      .join("");
  }

  //  1. 위 Promise.all로 이미 받아둔 목록 데이터를 캐시 + 렌더링
  cacheAnimals(allAnimalData); // 상세 페이지가 재요청 없이 쓰도록 원본 캐시
  renderAnimals(allAnimalData); // 처음엔 전체 데이터 기본 렌더링
  // -------------------------------------------------------------
  // 2. 지역 필터 칩(API 데이터에서 시/도별 집계)
  // -------------------------------------------------------------
  const regionFilter = document.querySelector("#region-filter");
  const getSido = (item) => (item.orgNm || "").split(" ")[0]; // 경상북도 영주시 => 경상북도

  function renderRegionFilter() {
    if (!regionFilter || !allAnimalData.length) return;

    const counts = {}; // 시도별 개수 담을 객체
    allAnimalData.forEach((item) => {
      const sido = getSido(item);
      if (sido) counts[sido] = (counts[sido] || 0) + 1;
    });

    // 객체값을-> [key,value] 배열, {"경북", 12} -> ["경북", 12]
    const regions = Object.entries(counts)
      // 구조 분해 [, n] 첫 요소는 건너뛰고 n만 받음 3마리 이상인 지역만
      .filter(([, n]) => n >= 3)
      // a, b = [이름, 개수] 쌍 개수 내림차순(많은 순)
      .sort((a, b) => b[1] - a[1])
      // 이름만 뽑아서 문자열 배열
      .map(([name]) => name);
    // 배열을 펼쳐서 앞에 "전체" 붙임
    regionFilter.innerHTML = ["전체", ...regions]
      .map(
        (name, i) =>
          `<button type="button" class="btn btn--chip${i === 0 ? " is-active" : ""}" data-region="${name}">${name}</button>`,
      )
      .join("");

    // querySelectorAll로 변경하여 전체 버튼 순회
    regionFilter.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        regionFilter
          .querySelectorAll("button")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active"); // 클릭한 버튼 활성화 추가

        const region = btn.dataset.region;
        renderAnimals(
          region === "전체"
            ? allAnimalData // 전체면 원본 그대로
            : // 아니면 그 지역만
              allAnimalData.filter((item) => getSido(item) === region),
        );
      });
    });
  }
  renderRegionFilter();
  // -------------------------------------------------------------
  // [4단계] 베스트 입양후기 렌더링 및 호버 이벤트
  // -------------------------------------------------------------
  const adopReview = document.querySelector("#best-dummy");

  if (adopReview) {
    adopReview.innerHTML = ADOPTION_REVIEWS.map(
      (r) => `
      <li class="best-card">
      <div class="best-thumb">
        <img src="${r.afterImg}" alt="${r.name}" data-after="${r.afterImg}" data-before="${r.beforeImg}" onerror="imgError(this)"/>
        <span class="best-badge">입양 후</span>
        </div>
        <span class="best-name">${r.name}</span>
      </li>
      `,
    ).join("");

    // 마우스 호버 이벤트 설정 (입양 전/후 이미지 및 배지 전환)
    // forEach로 순회하면서 카드마다 이벤트
    adopReview.querySelectorAll(".best-card").forEach((card) => {
      const img = card.querySelector("img");
      const badge = card.querySelector(".best-badge");
      // 이미지 없으면 카드 스킵
      if (!img) return;

      // 마우스 갖다 댈 시
      card.addEventListener("mouseenter", () => {
        // html에 넣어논 data-before 읽어오기
        img.src = img.dataset.before;
        badge.textContent = "입양 전"; // 뱃지 텍스트 교체
        badge.classList.add("is-before"); // CSS 회색 클래스
      });
      // 마우스 뗄 시
      card.addEventListener("mouseleave", () => {
        img.src = img.dataset.after;
        badge.textContent = "입양 후";
        badge.classList.remove("is-before");
      });
    });
  }
});

// -------------------------------------------------------------
// [5단계] "오늘의 추천동물 더보기" → 동물검색 페이지로 이동
// (소식 더보기는 news.html 링크, 나머지 섹션은 별도 목록 페이지가 없어 버튼 제거)
// -------------------------------------------------------------
document.querySelectorAll('.btn-more[data-category="today"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "search.html";
  });
});
// -------------------------------------------------------------
// [6단계] 기부 챌린지 영역
// -------------------------------------------------------------
const donationContainer = document.querySelector("#donation-dummy");

if (donationContainer) {
  donationContainer.innerHTML = DONATION_CHALLENGES.map((item) => {
    // Math.min(계산값, 100) : 둘 중 작은값. 초과 모금돼도 100% 넘지않게함
    const percent = Math.min(
      // Math.round로 반올림
      Math.round((item.current / item.goal) * 100),
      100,
    );
    return `
    <div class="donation-card">
      <img src="${item.image}" alt="${item.title}" onerror="imgError(this)" />
      <div class="donation-info">
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="donation-meta">
          <span class="percent">${percent}% 달성</span>
          <span class="amount">${item.current.toLocaleString()}원 / ${item.goal.toLocaleString()}원</span>
        </div>
      </div>
    </div>
    `;
  }).join("");
}
