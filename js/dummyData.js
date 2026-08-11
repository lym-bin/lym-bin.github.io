// ===================================================================
//                              전체흐름
//  1. 더미데이터 정의 (변수 선언, 아직 실행 X)
//  2. 지역 카드 렌더링 (스크립트 로드되자마자 바로 실행)
//  3. 보호동물 카드 렌더링 (스크립트 로드되자마자 바로 실행)
//  4. DOM 요소들 선택 (변수에 담아두기만 함)
//  5. 이벤트 리스너 등록 (등록만 해두고, 클릭 전까진 대기)
// └ 클릭 발생 시에만 아래 함수들이 실행됨
//      - 모달 열기/닫기
//      - 필터 폼 제출 → 데이터 필터링 → 재렌더링
//      - "최근 3개월" 태그 클릭 → 자동 세팅 → 검색 실행
//
//
//====================================================================

// [1. 상단 지역/보호소 더미 데이터]
// - 상단에 노출할 지역 카드 5개 (지역명 + 이미지) 배열로 정의
const regionData = [
  { name: "서울특별시 동대문구", image: "images/todaycard_1.svg" },
  { name: "서울특별시 영등포구", image: "images/todaycard_2.svg" },
  { name: "서울특별시 마포구", image: "images/todaycard_3.svg" },
  { name: "서울특별시 노원구", image: "images/todaycard_1.svg" },
  { name: "강원특별자치도 강릉시", image: "images/todaycard_2.svg" },
];
// - .list-design 요소를 찾아서 있으면(있을 때만) 렌더링 실행
const regionContainer = document.querySelector(".list-design");
if (regionContainer) {
  // - regionData 배열을 순회하며 <li> HTML 문자열로 변환 후 한번에 삽입
  regionContainer.innerHTML = regionData
    .map(
      (item) => `
    <li>
      <a href="detail.html">
        <img src="${item.image}" alt="${item.name}" />
        <span>${item.name}</span>
      </a>
    </li>
  `,
    )
    .join("");
}

// [2. 동물 보호 더미 데이터]
// - 보호중인 동물 5마리 정보 (상태, 성별, 공고번호, 날짜, 장소, 지역, 종 등)
const protectData = [
  {
    id: 1,
    state: "보호중",
    sexCd: "암컷",
    num: "서울-포핸-2026-00025-P",
    date: "2026.08.03",
    loc: "서귀포시 대정읍 신평리",
    image: "images/todaycard_1.svg",
    region: "제주특별자치도",
    species: "개",
  },
  {
    id: 2,
    state: "보호중",
    sexCd: "수컷",
    num: "서울-시립2-2026-00065-P",
    date: "2026.08.03",
    loc: "경기 양주시",
    image: "images/todaycard_2.svg",
    region: "경기도",
    species: "개",
  },
  {
    id: 3,
    state: "보호중",
    sexCd: "암컷",
    num: "서울-시립2-2026-00064-P",
    date: "2026.08.03",
    loc: "경기 연천군",
    image: "images/todaycard_3.svg",
    region: "경기도",
    species: "개",
  },
  {
    id: 4,
    state: "보호중",
    sexCd: "수컷",
    num: "서울-시립2-2026-00063-P",
    date: "2026.08.03",
    loc: "서울 노원구",
    image: "images/todaycard_1.svg",
    region: "서울특별시",
    species: "개",
  },
  {
    id: 5,
    state: "보호중",
    sexCd: "수컷",
    num: "서울-시립2-2026-00062-P",
    date: "2026.08.03",
    loc: "경기 포천시",
    image: "images/todaycard_2.svg",
    region: "경기도",
    species: "개",
  },
];

const container = document.querySelector(".protect-boho");

// - 데이터를 받아서 카드로 그려주는 함수 (재사용 목적으로 함수화)
//   → 필터링 후에도 이 함수를 다시 호출해서 재렌더링할 예정
function renderProtectCards(data) {
  if (!container) return;

  // - 검색 결과가 0개면 "결과 없음" 메시지 표시
  if (data.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 20px; color: #888;">검색 결과가 없습니다.</p>`;
    return;
  }
  // - 배열 순회하며 카드 HTML(이미지+뱃지+상세정보 dl) 생성 후 삽입
  container.innerHTML = data
    .map((item) => {
      return `
      <li>
        <a href="detail.html">
          <img src="${item.image}" alt="동물 이미지" />
          <div class="card-info">
            <div class="badge-group">
              <span class="badge state">${item.state}</span>
              <span class="badge sex">${item.sexCd}</span>
            </div>
            <dl>
              <dt>품종</dt>
              <dd>개[믹스견]</dd>
              <dt>공고번호</dt>
              <dd>${item.num}</dd>
              <dt>등록날짜</dt>
              <dd>${item.date}</dd>
              <dt>구조장소</dt>
              <dd>${item.loc}</dd>
            </dl>
          </div>
        </a>
      </li>
    `;
    })
    .join("");
}

// - 함수 정의 직후, 페이지 최초 진입 시 전체 데이터로 1회 실행
renderProtectCards(protectData);

// [3. DOM 요소 선언]
const filterBtn = document.querySelector(".filter-btn"); // 필터 버튼
const modal = document.querySelector(".filter-event"); // 필터 모달창
const closeBtn = document.querySelector(".close-btn"); // 모달 닫기 버튼
const filterForm = document.querySelector(".filter-event form"); // 모달 안 필터 폼

const tagPeriod = document.querySelector(".tag-period"); // 상단 "기간" 태그
const tagRegion = document.querySelector(".tag-region"); // 상단 "지역" 태그
const tagSpecies = document.querySelector(".tag-species"); // 상단 "종" 태그

// 체크박스 & 날짜 인풋 (name 속성으로 우선 찾고, 없으면 nth-of-type으로 대체 탐색)
const recent3MonthsCheckbox = document.querySelector(
  "input[name='recent3Months']",
);
const startDateInput =
  document.querySelector("input[name='startDate']") ||
  document.querySelector(".filter-event input[type='date']:nth-of-type(1)");
const endDateInput =
  document.querySelector("input[name='endDate']") ||
  document.querySelector(".filter-event input[type='date']:nth-of-type(2)");

// [4. 모달 토글 제어]
// - 필터 버튼 클릭 → 모달에 .show 클래스 추가 (모달 열림)
if (filterBtn && modal) {
  filterBtn.addEventListener("click", () => {
    modal.classList.add("show");
  });
}

// - 닫기 버튼 클릭 → .show 클래스 제거 (모달 닫힘)
if (closeBtn && modal) {
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });
}

// - 모달의 배경(어두운 오버레이) 클릭 시에도 닫히게 처리
//   (e.target === modal → 모달 내부 컨텐츠가 아니라 배경 자체를 클릭했을 때만 닫힘)
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
}

// [5. 공통 함수: 3개월 날짜 계산 및 인풋/체크박스 고정 세팅]
function applyThreeMonthsSetting() {
  const today = new Date();
  const endDateStr = today.toISOString().split("T")[0]; // 오늘 날짜 (YYYY-MM-DD)

  const priorDate = new Date();
  priorDate.setMonth(priorDate.getMonth() - 3);
  const startDateStr = priorDate.toISOString().split("T")[0]; // 3개월 전 날짜 (YYYY-MM-DD)

  // 날짜 인풋창에 값 고정
  if (startDateInput && endDateInput) {
    startDateInput.value = startDateStr;
    endDateInput.value = endDateStr;
  }

  // 체크박스 체크 상태 고정
  if (recent3MonthsCheckbox) {
    recent3MonthsCheckbox.checked = true;
  }

  // 상단 태그 글자 변경
  if (tagPeriod) {
    tagPeriod.textContent = "최근 3개월";
  }
}

// [6. [검색하기] 버튼 폼 제출 이벤트 (필터링 실행)]
if (filterForm) {
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault(); // 새로고침 방지

    // 폼 안의 선택된 값들 한번에 추출
    const formData = new FormData(filterForm);
    const selectedRegion = formData.get("region");
    const selectedSpecies = formData.get("species");
    const selectedStatus = formData.get("status");
    const selectedGender = formData.get("gender");
    const selectedNeuter = formData.get("neuter");
    const onlyProtect = formData.get("recent3Months");

    // 만약 사용자가 '최근 3개월' 체크박스를 체크한 채로 검색했다면 인풋창 값도 자동으로 세팅되게 고정
    if (onlyProtect) {
      applyThreeMonthsSetting();
    } else {
      if (tagPeriod) {
        tagPeriod.textContent = "전체 기간";
      }
    }

    // 상단 태그 텍스트를 선택값으로 실시간 업데이트
    if (tagRegion) {
      tagRegion.textContent = selectedRegion || "모든 지역";
    }

    if (tagSpecies) {
      tagSpecies.textContent = selectedSpecies || "모든 동물";
    }

    // protectData 원본 배열을 조건에 맞게 필터링
    const filteredData = protectData.filter((item) => {
      const matchRegion =
        !selectedRegion ||
        selectedRegion === "모든 지역" ||
        item.loc.includes(selectedRegion) ||
        (item.region && item.region === selectedRegion);

      const matchSpecies =
        !selectedSpecies ||
        selectedSpecies === "모든 동물" ||
        item.species === selectedSpecies;

      const matchStatus =
        !selectedStatus ||
        selectedStatus === "전체" ||
        item.state === selectedStatus;

      const matchGender =
        !selectedGender ||
        selectedGender === "전체" ||
        item.sexCd === selectedGender;

      return matchRegion && matchSpecies && matchStatus && matchGender;
    });

    // 필터링된 결과로 STEP 2의 렌더링 함수 재호출 → 카드 목록 갱신
    renderProtectCards(filteredData);

    // 검색 완료 후 모달 자동 닫기
    if (modal) {
      modal.classList.remove("show");
    }
  });
}

// [7. 상단 [최근 3개월] 태그 버튼 클릭 시]
if (tagPeriod) {
  tagPeriod.addEventListener("click", () => {
    applyThreeMonthsSetting(); // 3개월 날짜 및 체크박스 자동 지정 및 고정

    // 세팅 후 바로 폼 제출까지 자동 실행 (사용자가 검색 버튼 안 눌러도 됨)
    if (filterForm) {
      filterForm.requestSubmit();
    }
  });
}
