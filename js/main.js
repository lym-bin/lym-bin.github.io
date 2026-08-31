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
// ==========================================
// 포인핸드 소식 슬라이더 (배너 순환)
// ==========================================
(function newsSlider() {
  const slider = document.getElementById("news-slider");
  if (!slider) return;

  const track = slider.querySelector(".news-track");
  const slides = slider.querySelectorAll(".news-slide");
  let index = 0;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  slider
    .querySelector(".news-prev")
    .addEventListener("click", () => go(index - 1));
  slider
    .querySelector(".news-next")
    .addEventListener("click", () => go(index + 1));

  // 5초 자동 넘김 (마우스 올리면 정지)
  let timer = setInterval(() => go(index + 1), 5000);
  slider.addEventListener("mouseenter", () => clearInterval(timer));
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
  const statsDateEl = document.getElementById("stats-date");
  // stats-date라는 아이디를 가진 html태그가 안전하게 존재한다면
  if (statsDateEl) {
    statsDateEl.textContent = `${yy}.${mm}.${dd} 유기동물 현황`;
  }

  // -------------------------------------------------------------
  // [2단계] api.js의 통계 데이터 가져오기
  // -------------------------------------------------------------

  // 외부 API 파일에 선언된 통계 조회 함수를 비동기(await)로 호출하여 데이터를 기다림
  const statsData = await fetchAnimalStats();

  if (statsData && statsData.length > 0) {
    // chart1 = 처리상태별 "마리 수" (보호중 / 자연사 / 입양 / 기증 / 반환 / 안락사)
    // 주의: tot 값은 비율(%)이 아니라 마리 수. 예전엔 %로 잘못 표기했음.
    const chart1 = statsData.filter((item) => item.se === "chart1");
    const countOf = (name) => {
      const hit = chart1.find((item) => item.prcsNm === name);
      return hit ? Number(hit.tot) || 0 : 0;
    };

    const care = countOf("보호중");
    const adopt = countOf("입양");
    const ret = countOf("반환");
    const donate = countOf("기증");
    const natural = countOf("자연사");
    const eol = countOf("안락사");

    // --- 핵심 수치 타일 ---
    const setNum = (id, n) => {
      const el = document.getElementById(id);
      if (el) el.textContent = n.toLocaleString();
    };
    setNum("statCare", care);
    setNum("statAdopt", adopt);
    setNum("statEol", eol);

    // --- 보호 종료 결과 스택 바 (보호중 제외, 종료 5개 항목 비율) ---
    const segments = [
      { name: "입양", value: adopt, color: "#007bff" },
      { name: "반환", value: ret, color: "#17a2b8" },
      { name: "기증", value: donate, color: "#6f42c1" },
      { name: "자연사", value: natural, color: "#868e96" },
      { name: "안락사", value: eol, color: "#fd7e14" },
    ];
    const endedTotal = segments.reduce((sum, s) => sum + s.value, 0);
    const barEl = document.getElementById("statsBar");
    const legendEl = document.getElementById("statsLegend");

    if (barEl && legendEl && endedTotal > 0) {
      barEl.innerHTML = segments
        .filter((s) => s.value > 0)
        .map(
          (s) =>
            `<span class="seg" style="width:${((s.value / endedTotal) * 100).toFixed(2)}%;background:${s.color}" title="${s.name} ${s.value.toLocaleString()}마리"></span>`,
        )
        .join("");

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
  const listContainer = document.getElementById("today-dummy");

  // 데이터를 받아와서 화면에 카드형태로 렌더링하는 함수
  function renderAnimals(data) {
    if (!listContainer) return;
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
      .map((animal) => {
        const kind = animal.kindNm || animal.kindCd || "품종 정보 없음";
        const sex =
          animal.sexCd === "M"
            ? "수컷"
            : animal.sexCd === "F"
              ? "암컷"
              : "미상";
        const age = animal.age || "나이 미상";
        const img = animal.popfile1 || animal.popfile2 || "";
        const desertionNo = animal.desertionNo || "";

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

  //  1. 페이지 처음 켜졌을 때 '전국 유기동물 목록' 불러오기
  // (함수 이름은 api.js에 정의한 이름으로 맞추기)
  showSkeleton(listContainer, 5); // API 응답 대기 중 스켈레톤 표시
  const allAnimalData = await fetchAnimalsList();
  cacheAnimals(allAnimalData); // 상세 페이지가 재요청 없이 쓰도록 원본 캐시
  //  데이터가 있다면 첫 번째 동물의 모든 속성 이름과 값을 확인
  // if (allAnimalData && allAnimalData.length > 0) {
  //   console.log(
  //     "첫 번째 동물 객체의 모든 필드명:",
  //     Object.keys(allAnimalData[0]),
  //   );
  //   console.log("첫 번째 동물 객체 전체 데이터:", allAnimalData[0]);
  // }
  // 처음에 전체 데이터 기본 렌더링
  renderAnimals(allAnimalData);
  // -------------------------------------------------------------
  // 2. 지역 필터 칩(API 데이터에서 시/도별 집계)
  // -------------------------------------------------------------
  const regionFilter = document.getElementById("region-filter");
  const getSido = (item) => (item.orgNm || "").split(" ")[0]; // 경상북도 영주시 => 경상북도

  function renderRegionFilter() {
    if (!regionFilter || !allAnimalData.length) return;

    const counts = {};
    allAnimalData.forEach((item) => {
      const sido = getSido(item);
      if (sido) counts[sido] = (counts[sido] || 0) + 1;
    });

    const regions = Object.entries(counts)
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

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
            ? allAnimalData
            : allAnimalData.filter((item) => getSido(item) === region),
        );
      });
    });
  }
  renderRegionFilter();
  // -------------------------------------------------------------
  // [4단계] 베스트 입양후기 렌더링 및 호버 이벤트
  // -------------------------------------------------------------
  const adopReview = document.getElementById("best-dummy");
  const adopDummy = [
    {
      name: "초코",
      afterImg: "images/dog_2.png",
      beforeImg: "images/dog_1.png",
    },
    {
      name: "구름",
      afterImg: "images/dog_4.png",
      beforeImg: "images/dog_3.png",
    },
    {
      name: "쵸파",
      afterImg: "images/dog_6.png",
      beforeImg: "images/dog_5.png",
    },
    {
      name: "가을",
      afterImg: "images/cat_2.png",
      beforeImg: "images/cat_1.png",
    },
  ];

  if (adopReview) {
    adopReview.innerHTML = adopDummy
      .map(
        (r) => `
      <li class="best-card">
      <div class="best-thumb">
        <img src="${r.afterImg}" alt="${r.name}" data-after="${r.afterImg}" data-before="${r.beforeImg}" onerror="imgError(this)"/>
        <span class="best-badge">입양 후</span>
        </div>
        <span class="best-name">${r.name}</span>
      </li>
      `,
      )
      .join("");

    // 마우스 호버 이벤트 설정 (입양 전/후 이미지 및 배지 전환)
    adopReview.querySelectorAll(".best-card").forEach((card) => {
      const img = card.querySelector("img");
      const badge = card.querySelector(".best-badge");
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        img.src = img.dataset.before;
        badge.textContent = "입양 전";
        badge.classList.add("is-before");
      });
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
const donationContainer = document.getElementById("donation-dummy");
const donationDummy = [
  {
    title: "여름나기 물품 지원",
    desc: "더위에 힘든 아이들에게 용품을",
    current: 3200000,
    goal: 5000000,
    image: "images/donation_1.png",
  },
  {
    title: "중성화 수술 지원",
    desc: "유기를 막기 위한 필수 수술비",
    current: 1800000,
    goal: 5000000,
    image: "images/donation_2.png",
  },
  {
    title: "긴급 치료비 기금",
    desc: "다치고 아픈 아이들의 수술비 모금",
    current: 4100000,
    goal: 5000000,
    image: "images/donation_3.png",
  },
];

if (donationContainer) {
  donationContainer.innerHTML = donationDummy
    .map((item) => {
      const percent = Math.min(
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
    })
    .join("");
}
