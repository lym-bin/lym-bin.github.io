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

// 자바스크립트 파일이 브라우저에 정상적으로 연결되었는지 확인하는 로그
console.log("main.js 파일이 정상적으로 로드되었습니다!");

/**
 *  [핵심 용어: DOMContentLoaded 이벤트]
 * - 웹 브라우저가 HTML 뼈대를 전부 읽고 그릴 준비가 끝났을 때 안전하게 코드를 실행시켜 주는 이벤트.
 * - 이 이벤트 안에서 비동기 함수(async)를 선언하여 화면 제어 로직을 시작.
 */

// 웹 페이지의 HTML(DOM)이 모두 로드 완료되면 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM 로드 완료!");

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
    // 찾은 html태그의 텍스트 내용을 00.00.00 유기동물 통계로 변경
    statsDateEl.textContent = `${yy}.${mm}.${dd} 유기동물 통계`;
  }

  // -------------------------------------------------------------
  // [2단계] api.js의 통계 데이터 가져오기
  // -------------------------------------------------------------

  // 외부 API 파일에 선언된 통계 조회 함수를 비동기(await)로 호출하여 데이터를 기다림
  const statsData = await fetchAnimalStats();

  // 데이터가 존재하고 비어있지 않은지 검사하는 방어 코드
  // statsData가 실제로 존재하고 개수가 0보다 클 때만(즉 깡통데이터면 false)
  if (statsData && statsData.length > 0) {
    // 데이터중 첫 데이터를 가져와라
    const latestData = statsData[0];
    const totCntEl = document.getElementById("totCnt");
    const adoptRateEl = document.getElementById("adoptRate");
    const euthanasiaRateEl = document.getElementById("euthanasiaRate");

    // 구조율을 보여줄 태그가 존재할 때
    if (totCntEl) {
      // latestData(외부 api데이터)가 정상적으로 들어와있으면 그 값을 쓰고

      // 만약 값이 없거나 비어있으면 (null, undefined)에러가 날 것같으면
      // 기본값인 0을 써라
      // ??(null 병합 연산자)은 데이터가 없으면 에러 안 나게 기본값(0이나 빈 글자)으로 대체해 주는 아주 똑똑한 방어 도구
      const rawTot = Number(latestData.tot ?? 0);
      // 구조된 마리 데이터를 .toLocaleString(js에서 제공하는 숫자에 3자리마다 콤마를 찍어줌)
      // ex) 10000 > 10,000 형식으로 totCnt안에 넣어줌
      totCntEl.textContent = rawTot.toLocaleString();
    }

    // 입양율 통계 배열 안에서 "입양" 또는 "adopt" 라는 속성을 가진 항목 찾기
    const adoptItem = statsData.find(
      // 이 작업은 필터링 item라는 각각의 아이템에서 prcsNm이라는 이름이 입양이거나
      // || (or) 구분값(se)이 adopt인거만 골라내라
      (item) => item.prcsNm === "입양" || item.se === "adopt",
    );
    // 안락사율 통계 배열 안에서 "안락사" 또는 "euthanasia" 라는 속성을 가진 항목 찾기
    const euthanasiaItem = statsData.find(
      (item) => item.prcsNm === "안락사" || item.se === "euthanasia",
    );

    // * 중요한 삼항연산자
    //[조건] ? [참(true)일 때 실행할 것] : [거짓(false)일 때 실행할 것]
    // ? : 조건이 맞니?(물어봄), : 아니면 이걸 해라(나누는 역할)

    // adoptItem(입양 데이터가 존재하는가?) true면 실행
    if (adoptRateEl) {
      adoptRateEl.textContent = adoptItem
        ? (adoptItem.tot ?? "0")
        : // ? adoptItem.tot ?? "0" 참 일때: 존재한다면 그 안의 값을 쓰고 없으면 "0을"써라
          //거짓 일때: 존재하지 않는다면 전체데이터에서 입양률을 가져오고 , 그것도 없으면 "0을"써라
          (latestData.adoptRate ?? "0");
    }
    if (euthanasiaRateEl) {
      euthanasiaRateEl.textContent = euthanasiaItem
        ? (euthanasiaItem.tot ?? "0")
        : (latestData.euthanasiaRate ?? "0");
    }
  }

  // -------------------------------------------------------------
  // [3단계] 유기동물 추천 및 지역 버튼 연동 (API 데이터 필터링))
  // -------------------------------------------------------------
  const listContainer = document.getElementById("today-dummy");
  const regionButtons = document.querySelectorAll("#today-region li");

  // 데이터를 받아와서 화면에 카드형태로 렌더링하는 함수
  function renderAnimals(data) {
    if (!listContainer) return;
    listContainer.innerHTML = "";

    // 데이터가 아에 없을 때의 방어코드
    if (!data || data.length === 0) {
      listContainer.innerHTML =
        "<li>해당 지역에 등록된 동물 데이터가 없습니다.</li>";
      return;
    }

    // 기존 레이아웃인 4열 레이아웃을 위해 최대 4개까지만 잘라서 배치
    const limitedData = data.slice(0, 4);

    limitedData.forEach((animal) => {
      // 유기동물 조회 API가 보내주는 실제 데이터 속성명 매핑
      const kind = animal.kindNm || animal.kindCd || "품종 정보 없음";
      const sex =
        animal.sexCd === "M" ? "수컷" : animal.sexCd === "F" ? "암컷" : "미상";
      const age = animal.age || "나이 미상";
      const img = animal.popfile1 || animal.popfile2;
      const desertionNo = animal.desertionNo || "";
      const cardHTML = `
        <li>
          <a href="detail.html?num=${desertionNo}">
            <img src="${img}" alt="animal">
            <span>품종: ${kind}</span>
            <span>성별: ${sex}</span>
            <span>나이: ${age}</span>
          </a>
        </li>
      `;
      listContainer.innerHTML += cardHTML;
    });
  }

  //  1. 페이지 처음 켜졌을 때 '전국 유기동물 목록' 불러오기
  // (함수 이름은 api.js에 정의한 이름으로 맞추기)
  let allAnimalData = await fetchAnimalsList();
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
  // 2. 지역 버튼 클릭 이벤트
  regionButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      // 클릭한 li 안의 span 태그(지역 이름) 가져오기
      const spanEl = button.querySelector("span");
      if (!spanEl) return;
      const selectedRegion = spanEl.textContent.trim();
      // 전체 동물 데이터 중 보호소 이름(careNm)이나 관할지역(orgNm)에 선택한 지역명이 포함된 항목 필터링
      const filteredData = allAnimalData.filter((item) => {
        const careName = item.careNm || "";
        const orgName = item.orgNm || "";
        return (
          careName.includes(selectedRegion) || orgName.includes(selectedRegion)
        );
      });
      // 만약 해당 지역 데이터가 존재하면 필터링된 결과 렌더링
      if (filteredData.length > 0) {
        renderAnimals(filteredData);
      } else {
        // html 시군도 각각 화면도출이 안되는 데이터가 있거나 적으면
        // alert로 사용자에게 안내함(포트폴리오 감점될까바....방어).
        alert(
          `현재 '${selectedRegion}' 지역에 등록된 실시간 공고가 없어 전체 추천 목록을 출력합니다.`,
        );
        renderAnimals(allAnimalData);
      }
    });
  });
  // -------------------------------------------------------------
  // [4단계] 베스트 입양후기 렌더링 및 호버 이벤트
  // -------------------------------------------------------------
  const adopReview = document.getElementById("best-dummy");
  const adopDummy = [
    {
      info: "초코의 입양 전/입양 후",
      popfile: "images/dog_1.png",
      beforefile: "images/dog_2.png",
    },
    {
      info: "구름이의 입양 전/입양 후",
      popfile: "images/dog_3.png",
      beforefile: "images/dog_4.png",
    },
    {
      info: "쵸파의 입양 전/입양 후",
      popfile: "images/dog_5.png",
      beforefile: "images/dog_6.png",
    },
    {
      info: "가을이의 입양 전/입양 후",
      popfile: "images/cat_1.png",
      beforefile: "images/cat_2.png",
    },
  ];

  if (adopReview) {
    let html = "";
    adopDummy.forEach((review) => {
      html += `
        <li>
          <a href="">
            <img src="${review.popfile}" alt="${review.info}" data-after="${review.popfile}" data-before="${review.beforefile}"/>
            <span>${review.info}</span>
          </a>
        </li>
      `;
    });
    adopReview.innerHTML = html;

    // 마우스 호버 이벤트 설정
    const cards = document.querySelectorAll("#best-dummy li");
    cards.forEach((card) => {
      const imgElement = card.querySelector("img");
      if (!imgElement) return;

      const beforeImage = imgElement.getAttribute("data-before");
      const afterImage = imgElement.getAttribute("data-after");

      card.addEventListener("mouseover", () => {
        if (beforeImage && beforeImage !== "undefined") {
          imgElement.setAttribute("src", beforeImage);
        }
      });

      card.addEventListener("mouseout", () => {
        if (afterImage && afterImage !== "undefined") {
          imgElement.setAttribute("src", afterImage);
        }
      });
    });
  }
});

// -------------------------------------------------------------
// [5단계] "더보기" 버튼 클릭 시 관련 페이지로 이동
// -------------------------------------------------------------
document.querySelectorAll(".btn-more").forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;

    switch (category) {
      case "today": // 오늘의 추천동물 → 동물검색 페이지로
        window.location.href = "search.html";
        break;
      case "best": // 베스트 입양후기 → 아직 별도 페이지 없음
        alert("입양후기 페이지는 준비 중입니다.");
        break;
      case "news": // 포인핸드 소식 → 마찬가지
        alert("소식 페이지는 준비 중입니다.");
        break;
      case "missing": // 실종/제보 → 마찬가지
        alert("실종/제보 페이지는 준비 중입니다.");
        break;
      case "donation": //기부 챌린지
        alert("기부 챌린지 페이지는 준비 중입니다.");
        break;
      default:
        window.location.href = "shelter.html";
    }
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
      <img src="${item.image}" alt="${item.title}" />
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
