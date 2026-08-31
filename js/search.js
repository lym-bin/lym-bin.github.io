// ==========================================
// search.js — 동물 검색 페이지 전체 로직
// 이 파일이 하는 일 (순서대로):
//  1. API 데이터 가져와서 기본 렌더링
//  2. 검색어(품종/지역/특징) 입력 시 실시간 필터링
//  3. 상태(보호중/긴급/입양완료) 체크박스 필터
//  4. 최신순/오래된순 정렬
//  5. 더보기 페이지네이션
//  6. 찜하기(♡) 버튼 localStorage 저장
// ==========================================

// -------------------------------------------------------------
// [1] 전역 상태 변수
// 언제 어디서든 사용할 수 있고 유지 할 수있게 전역 변수 설정
// -------------------------------------------------------------

let allSearchData = []; // API에서 받아온 전체 데이터 (원본)
let currentFilteredData = []; // 현재 필터링(검색어/상태)된 전체 데이터 관리
let displayLimit = 12; // 초기 노출 개수 (3열 4줄= 12개)

// -------------------------------------------------------------
// [2] DOM 요소 제어
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("search-input");
  const searchForm = document.querySelector(".form-container form");
  const countSpan = document.querySelector(".info-space span"); // "전체 n건"
  const searchListContainer = document.querySelector(".search-list"); // 카드가 그려질 ul
  const moreBtn = document.querySelector(".more-btn");

  // 상태 필터 드롭다운 관련 요소
  const statusFilterBtn = document.getElementById("status-filter-btn");
  const statusFilterPanel = document.getElementById("status-filter-panel");
  const statusCheckboxes = statusFilterPanel
    ? statusFilterPanel.querySelectorAll('input[name="status"]')
    : [];
  const applyBtn = statusFilterPanel
    ? statusFilterPanel.querySelector(".filter-apply-btn")
    : null;
  const likedFilterBtn = document.getElementById("liked-filter-btn");
  let showLikedOnly = false;

  // 현재 선택된 상태 그룹(초기값: 3개 다 체크 된 상태)
  let selectedStatuses = new Set(["보호중", "긴급", "종료"]);

  // -------------------------------------------------------------
  // [3] 원본 상태값(API 문구)을 3개 그룹 중 하나로 분류하는 함수
  // -------------------------------------------------------------
  // 예: "종료(자연사)" → "종료" 그룹으로 묶는다.
  function getStatusGroup(state) {
    if (state.includes("긴급")) return "긴급";
    if (state.includes("종료") || state.includes("완료")) return "종료";
    return "보호중";
  }

  // -------------------------------------------------------------
  // [4] 상태 필터 드롭다운 열기/닫기
  // -------------------------------------------------------------
  // 버튼과 패널이 존재하면 실행
  if (statusFilterBtn && statusFilterPanel) {
    // 버튼에다가 클릭이벤트 달아줌
    statusFilterBtn.addEventListener("click", (e) => {
      //
      e.stopPropagation();
      // 현재 드롭다운이 숨겨진(hidden)이 있는지 선언하는 부분
      // hasAttribute: html태그에 어떤 특정 속성이 붙어있는지 물어보는 js 메서드
      const isHidden = statusFilterPanel.hasAttribute("hidden");
      // 만약 isHidden이 존재한다면 패널을 제거하고 숨김
      // 버튼에 속성을 aria-expanded 웹 접근성을 위해 추가하고 true로
      // setAttribute: 이미 있는 속성의 값을 새로 추가하거나 값을 세팅해주는 메서드
      if (isHidden) {
        statusFilterPanel.removeAttribute("hidden");
        statusFilterBtn.setAttribute("aria-expanded", "true");
      } else {
        statusFilterPanel.setAttribute("hidden", "");
        statusFilterBtn.setAttribute("aria-expanded", "false");
      }
    });

    // 패널 바깥 클릭 시 닫기
    document.addEventListener("click", (e) => {
      if (
        // 패널 바깥쪽을 클릭했고, 그리고(&&)
        !statusFilterPanel.contains(e.target) &&
        // 클릭한 타켓(대상이) 열기/닫기 버튼 자체가 아니라면
        e.target !== statusFilterBtn
      ) {
        statusFilterPanel.setAttribute("hidden", "");
        statusFilterBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // -------------------------------------------------------------
  // [5] 상태 필터 "적용" 버튼
  // -------------------------------------------------------------
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      selectedStatuses = new Set(
        // statusCheckboxes을 배열 상자로 만들고
        Array.from(statusCheckboxes)
          // filter로 cb: 체크박스 조건에 맞는 것만 체킹
          .filter((cb) => cb.checked)
          // map으로 모든 데이터에 value값을 하나씩 꺼내서 새로운 배열을 만듬(형태 변환)
          .map((cb) => cb.value),
      );

      // 버튼 텍스트를 "상태 전체" 또는 "상태 n개"로 갱신
      statusFilterBtn.firstChild.textContent =
        selectedStatuses.size === 3
          ? "상태 전체 "
          : `상태 ${selectedStatuses.size}개 `;

      displayLimit = 12; // 필터가 바뀌었으니 노출 개수 초기화
      filterAndRender();
      statusFilterPanel.setAttribute("hidden", "");
      statusFilterBtn.setAttribute("aria-expanded", "false");
    });
  }

  // -------------------------------------------------------------
  // [6] 검색 폼 "초기화" 버튼 클릭 시 상태 필터도 함께 초기화
  // -------------------------------------------------------------
  if (searchForm) {
    searchForm.addEventListener("reset", () => {
      selectedStatuses = new Set(["보호중", "긴급", "종료"]);
      statusCheckboxes.forEach((cb) => (cb.checked = true));
      if (statusFilterBtn)
        statusFilterBtn.firstChild.textContent = "상태 전체 ";
      displayLimit = 12;
      // reset 이벤트는 input 값이 지워지기 "직전"에 발생
      // setTimtOut으로 실제로 비워진 값 기준으로 재검색
      setTimeout(filterAndRender, 0); // reset으로 input 값 비워진 다음 실행
    });
  }

  // -------------------------------------------------------------
  // [7] 정렬 버튼 (최신순 ↔ 오래된순 토글)
  // -------------------------------------------------------------
  const sortBtn = document.querySelector(".info-space button");
  let sortOrder = "desc"; // desc: 최신순, asc: 오래된순

  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      //삼항 연산자로 sortOrder를 클릭 했을 떄 그 값이 dsec랑 같으면
      // desc, 아니라면 asc
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
      // 실행
      sortBtn.textContent =
        sortOrder === "desc" ? "최신 등록순" : "오래된 등록순";
      displayLimit = 12;
      filterAndRender();
    });
  }

  // 찜하기 버튼만 보기
  if (likedFilterBtn) {
    likedFilterBtn.addEventListener("click", () => {
      showLikedOnly = !showLikedOnly;
      likedFilterBtn.textContent = showLikedOnly
        ? "♥ 전체보기"
        : "♡ 찜한 동물만";
      likedFilterBtn.classList.toggle("active", showLikedOnly);
      displayLimit = 12;
      filterAndRender();
    });
  }

  // -------------------------------------------------------------
  // [8] 조회 기간(최근 N일)을 계산하는 함수
  // -------------------------------------------------------------
  // 며칠 전(daysAgo) 매개변수로 만듬
  function getDateRange(daysAgo) {
    // API 파라미터(bgnde/endde)에 넣을 "YYYYMMDD" 형식 문자열을 만들어 줌.
    const format = (d) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    // new Date()라는 오늘 날짜와 시간을 가져오는 js 기본 객체
    const end = new Date(); // 오늘 날짜(종료일)
    const start = new Date(); // 오늘 날짜(시작일)
    start.setDate(start.getDate() - daysAgo); // 오늘 날짜에서 며칠 전(daysAgo)로 뺀다?민다

    // 완성된 시작일과 오늘(끝나는 날)을 포맷에 넣어서 객체로 돌려줌
    return { bgnde: format(start), endde: format(end) };
  }

  // -------------------------------------------------------------
  // [9] 페이지 진입 시 API 데이터 불러오기
  // -------------------------------------------------------------
  // 조회 기간을 최근 3일로 좁혀서 numOfRows(api.js에서 500으로 설정됨)로도
  // 그 기간의 데이터를 충분히 커버하게 하고, 등록일(happenDt)이 다양하게
  // 섞이도록 해서 정렬 기능이 실제로 눈에 띄게 동작하도록 만듬.
  const { bgnde, endde } = getDateRange(3);
  showSkeleton(searchListContainer, 12); // API 응답 대기 중 스켈레톤 표시
  const apiItems = await fetchProtectData({ bgnde, endde });
  cacheAnimals(apiItems); // 상세 페이지가 재요청 없이 쓰도록 원본 캐시

  if (apiItems && apiItems.length > 0) {
    allSearchData = apiItems.map((item, index) => ({
      id: index + 1,
      state: item.processState || "보호중",
      num: item.desertionNo, // 공고 번호 (상세 페이지로 이동 + 찜하기 식별자로 사용)
      image: item.popfile1 || "", // 기존 더미 이미지있던 버그 삭제
      rawKind: item.kindFullNm || item.kindCd || "", // 게[믹스견] 원본 형태(검색용)
      species: item.kindFullNm
        ? item.kindFullNm.replace(/\[.*?\]\s*/g, "")
        : item.kindCd || "정보 없음",
      loc: item.orgNm || "",
      specialMark: item.specialMark || "",
      noticeDate: item.noticeSdt || item.happenDt || "", // 정렬 기준 날짜
    }));

    filterAndRender();
  } else {
    showStateMessage(
      searchListContainer,
      "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
  }

  // -------------------------------------------------------------
  // [10] 검색 폼 제출(검색 버튼 클릭) 시
  // -------------------------------------------------------------
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      displayLimit = 12; // 검색 시 다시 12개부터 시작
      filterAndRender();
    });
  }
  // -------------------------------------------------------------
  // [11] 검색창에 실시간 입력 시 (엔터 없이도 바로 반응)
  // -------------------------------------------------------------
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      displayLimit = 12; // 검색어 변경 시 다시 12개부터 시작
      filterAndRender();
    });
  }
  // -------------------------------------------------------------
  // [12] 더보기 버튼 클릭 → 12개씩 추가로 노출
  // -------------------------------------------------------------
  moreBtn?.addEventListener("click", () => {
    displayLimit += 12;
    renderSearchCards(currentFilteredData);
  });

  // -------------------------------------------------------------
  // [13] 검색어 + 상태 필터 → 필터링 + 정렬 + 렌더링을 한 번에 처리하는 함수
  // -------------------------------------------------------------
  function filterAndRender() {
    // searchInput값을 공백제거하고 소문자로
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    currentFilteredData = allSearchData.filter((item) => {
      let keywordMatch = true;
      if (keyword) {
        // "개" 라는 키워드는 고양이도 포함 할 수 있기 때문에
        if (keyword === "개") {
          //  [개]라고 명칭을 포함시킴
          keywordMatch = item.rawKind.includes("[개]");
        } else {
          // 그외 검색어는 품종/지역/특징 한가지만 포함되면 패싱
          const species = item.species.toLowerCase();
          const loc = item.loc.toLowerCase();
          const mark = item.specialMark.toLowerCase();
          keywordMatch =
            species.includes(keyword) ||
            loc.includes(keyword) ||
            mark.includes(keyword);
        }
      }

      // --- 상세 필터 변수 조건 ---
      // 원본 상태값을 3개 그룹(보호중/긴급/종료) 중 하나로 바꾼뒤
      // 사용자가 체크한 그룹(selectedStatuses)안에 있는지 체크함
      const statusMatch = selectedStatuses.has(getStatusGroup(item.state));
      const likedMatch = !showLikedOnly || getLikedList().includes(item.num);

      return keywordMatch && statusMatch && likedMatch;
    });

    //  filter 끝난 다음, 정렬해서 한번만 실행함
    // filter 콜백 안에서 매번 sort를 누르면 불필요하게 반복 실행되므로 주의
    currentFilteredData.sort((a, b) => {
      const dateA = a.noticeDate || "";
      const dateB = b.noticeDate || "";
      return sortOrder === "desc"
        ? // localeCompare: 두 문자열의 순서를 비교하여 숫자로 반환해주는 메서드
          dateB.localeCompare(dateA) // 최신순
        : dateA.localeCompare(dateB); // 오래된 순
    });
    renderSearchCards(currentFilteredData);
  }

  // -------------------------------------------------------------
  // [14] 카드 목록 + 결과 건수를 실제 화면에 그리는 함수
  // -------------------------------------------------------------
  function renderSearchCards(data) {
    if (countSpan) {
      countSpan.textContent = `전체 ${data.length.toLocaleString()}건의 유기동물 공고`;
    }

    if (!searchListContainer) return;

    if (data.length === 0) {
      showStateMessage(
        searchListContainer,
        "조건에 맞는 검색 결과가 없습니다.",
      );
      if (moreBtn) moreBtn.style.display = "none";
      return;
    }

    //  현재 displayLimit 만큼 잘라서 화면에 표현 (더보기 페이지 네이션)
    const slicedData = data.slice(0, displayLimit);

    //  더 보여줄 데이터가 남았으면 버튼 표시, 다 보여줬으면 숨기기
    if (moreBtn) {
      if (displayLimit < data.length) {
        moreBtn.style.display = "block";
      } else {
        moreBtn.style.display = "none";
      }
    }

    // 상태값에 따라 뱃지 색상 클래스를 변경해주는 함수
    function getBadgeClass(state) {
      // 긴급이라는 글자가 포함되면 => badge-red 반환
      if (state.includes("긴급")) return "badge-red";
      // "종료" 이거나 ||(or) "완료"라는 글자가 포함되면
      if (state.includes("종료") || state.includes("완료"))
        // badge-green 반환
        return "badge-green";
      // 둘다 아니면 badge-blue 반환
      return "badge-blue";
    }

    // "20260827" → "26.08.27" 로 표시용 변환
    const formatDate = (d) =>
      d && d.length === 8
        ? `${d.slice(2, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
        : "";

    searchListContainer.innerHTML = slicedData
      .map((item) => {
        const isLiked = getLikedList().includes(item.num);
        const meta = [item.loc, formatDate(item.noticeDate)]
          .filter(Boolean)
          .join(" · ");
        return `
      <li>
        <span class="badge ${getBadgeClass(item.state)}">${item.state}</span>
        <a href="detail.html?num=${encodeURIComponent(item.num)}">
          <img src="${item.image}" alt="${item.species}" loading="lazy" onerror="imgError(this)" />
          <div class="card-body">
            <p class="card-species">${item.species}</p>
            <p class="card-meta">${meta}</p>
          </div>
        </a>
        <button type="button" class="like-btn ${isLiked ? "liked" : ""}" data-num="${item.num}" aria-label="찜하기">${isLiked ? "♥" : "♡"}</button>
      </li>
    `;
      })
      .join("");
    searchListContainer.querySelectorAll(".like-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); // 카드 링크 이동 막기
        e.stopPropagation(); // 즉시 멈춰줌 js메서드 함수

        const num = btn.dataset.num; // dataset(num)을 담아줄 변수
        const nowLiked = toggleLike(num); // localStorage 갱신 + 현재 찜 여부 반환

        // 버튼/아이콘 스타일을 갱신(화면을 다시 그리지 않고 버튼만)
        btn.textContent = nowLiked ? "♥" : "♡";
        btn.classList.toggle("liked", nowLiked);
      });
    });
  }
});

// ==========================================
// [15] 찜하기 기능 — localStorage 저장/조회
// (DOMContentLoaded 바깥에 둔 이유: 이 함수들은 이 파일의 다른 곳에서도
//  재사용될 수 있는 독립적인 유틸리티 함수라서 전역 스코프에 둔다.)
// ==========================================

//찜한 동물 번호 관리
const LIKED_KEY = "likedAnimals"; // localStorage에 쓸 키

function getLikedList() {
  try {
    // JSON.parse는 저장된 값이 없거나(null) 손상된 값이면 에러를 던짐
    // try-catch로 예외처리, 실패 시 return값을 배열로 반환
    return JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
  } catch {
    return [];
  }
}
// 특정 동물 번호를(num) 찜 목록에 추가/제거하고, 최종 찜 여부(boolean)을 반환
function toggleLike(num) {
  const liked = getLikedList();
  const index = liked.indexOf(num);
  if (index > -1) {
    liked.splice(index, 1); // 이미 찜했으면 제거함
  } else {
    liked.push(num); //안 찜했으면 추가
  }
  localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
  return liked.includes(num);
}
