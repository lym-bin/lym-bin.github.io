// ==========================================
// shelter.js — 보호소 페이지 전체 로직
//  실행순서 (순서대로):
//  1. 상단 지역 카드(더미) 렌더링 + 클릭 필터
//  2. 보호동물 카드 목록 렌더링 (API 데이터)
//  3. 필터 모달(지역/축종/상태/성별/기간) 처리
//  4. 더보기 페이지네이션
//  5. 상단 탭(보호동물 / 보호소 찾기 / 추천 입양 동물) 전환
//  6. 카카오맵으로 보호소 위치 표시
// ==========================================

// ==========================================
// [1] 상단 지역 카드 (더미 데이터)
//===========================================

// 실제 api에 "인기지역"? 같은 개념이 없어서 기본적으로 서울지역 하드코딩
// 이미지들 제작해서 순서대로 하드코딩할 예정(TO-BE)
const regionData = [
  { name: "서울특별시 동대문구", image: "images/todaycard_1.svg" },
  { name: "서울특별시 영등포구", image: "images/todaycard_2.svg" },
  { name: "서울특별시 마포구", image: "images/todaycard_3.svg" },
  { name: "서울특별시 노원구", image: "images/todaycard_1.svg" },
  { name: "강원특별자치도 강릉시", image: "images/todaycard_2.svg" },
];

const regionContainer = document.querySelector(".list-design");
if (regionContainer) {
  // img 템플릿에 loading="lazy" 추가 초기로딩 가볍게
  regionContainer.innerHTML = regionData
    .map(
      (item) => `
    <li>
      <a href="detail.html" class="region-click-btn" data-region="${item.name}">
        <img src="${item.image}" alt="${item.name}" loading="lazy"/>
        <span>${item.name}</span>
      </a>
    </li>
  `,
    )
    .join("");
}

// =================================================
// [2] 전역 상태 변수
// =================================================

let allProtectData = []; // API에서 받아온 전체 보호동물 데이터 (원본, 필터링 전)
let currentFilteredData = []; // 필터/검색이 적용된 현재 화면에 보여줄 데이터
let displayLimit = 12; // 한 번에 화면에 노출할 카드 개수 (더보기 누르면 12씩 증가)

// =================================================
// [3] DOM 요소 미리 찾아두기
// =================================================
const container = document.querySelector(".protect-boho"); // 카드 목록이 그려질 <ul>
const moreBtn = document.querySelector(".btn-more"); // 더보기 버튼 (shelter.html 마크업과 일치)
const filterBtn = document.querySelector(".filter-btn"); // "필터"버튼 (모달 열기)
const modal = document.querySelector(".filter-event"); // 필터 모달 전체 영역
const closeBtn = document.querySelector(".close-btn"); // 모달 닫기(X) 버튼
const filterForm = document.querySelector(".filter-event form"); // 모달 안의 검색 조건 폼
const tagPeriod = document.querySelector(".tag-period"); // 상단 "최근 3개월" 태그
const tagRegion = document.querySelector(".tag-region"); // 상단 지역 태그
const tagSpecies = document.querySelector(".tag-species"); // 상단 축종 태그

const recent3MonthsCheckbox = document.querySelector(
  "input[name='recent3Months']",
);

// startDateInput/endDateInput: name 속성으로 먼저 찾고, 없으면 순서 기반으로 대체 탐색
// (HTML 구조가 바뀌어도 최대한 안전하게 요소를 찾기 위한 방어 코드)
const startDateInput =
  document.querySelector("input[name='startDate']") ||
  document.querySelector(".filter-event input[type='date']:nth-of-type(1)");
const endDateInput =
  document.querySelector("input[name='endDate']") ||
  document.querySelector(".filter-event input[type='date']:nth-of-type(2)");

// =================================================
// [4] 상단 지역 카드 클릭 => 그 지역으로 바로 필터링
// =================================================
document.querySelectorAll(".region-click-btn").forEach((card) => {
  card.addEventListener("click", (e) => {
    e.preventDefault(); // <a> 태그의 기본 이동 (detail.html로 이동) 막기
    const regionName = card.dataset.region; // [1]에 동적으로 생성한 li태그에 data-region 속성값 읽기

    // textContent: html태그 무시하고 오직 글자만 취급
    // innerText: 사용자가 실제로 보이는 텍스트만 가져오거나 변경
    // innerHtml: 텍스트뿐만아니라 html태그까지 포함해서 넣거나 바꿈

    // 화면에 tagRegion(지역 이름표시 태그)가 존재하면
    // 그 안의 text를 클릭한 지역명으로 교체
    if (tagRegion) tagRegion.textContent = regionName;

    // api에서 가져온 전체동물데이터에서 filter(조건에 맞는 값만) 거쳐서
    // item 조건에 맞게 loc(지역정보)가 존재하고 regionName(지역이름)이 포함된다면 코드 진행
    currentFilteredData = allProtectData.filter(
      (item) => item.loc && item.loc.includes(regionName),
    );

    displayLimit = 12;
    // 바뀐 데이터를 기준으로 렌더링(재배치)
    renderProtectsCards(currentFilteredData);
  });
});

// =================================================
// [5] 카드 렌더링 함수(* 핵심 - 여러곳에서 재사용)
// * js에 중복된 코드가 많다면 함수하나를 만들어서 코드 여러줄을 함수하나로 처리가능
// 포인핸드 js에서 재사용 예시:
// 최초 페이지(DOMContentLoaded): API에서 데이터를 받아 오자마자 렌더링하기위해 호출
// 상단 지역 카드를 클릭 했을 떄: 사용자가 특정지역을 클릭하면 그 지역을 필터링 한뒤 렌더링
// 필터 모달에서 검색하기 클릭 했을 떄: 여러조건에서 걸러낸 데이터를 렌더링
// 더보기 버튼을 눌렀을 때: 보여줄 데이터 개수를(12개)더 늘린다음 렌더링
// =================================================

// data라는 매개변수명 매개변수랑 함수가 자판기면 매개변수는 자판기에 투입구
// 위에서 필터링을 거친 렌더링을 함수를 만들어 data라는 매개변수에 담아서
function renderProtectsCards(data) {
  // container가 존재하지 않는다면(null이면) 멈추고(return) 존재한다면 통과
  // js에서 !: ture든, false든 결과값을 뒤집어줌
  if (!container) return;

  // data매개변수(동물 카드)가 0이면
  // 컨테이너안에 "검색결과가 없습니다"를 넣고
  // 결과가 없으니깐 더보기 버튼도 아래로 숨김
  if (data.length === 0) {
    showStateMessage(container, "조건에 맞는 보호동물이 없습니다.");
    if (moreBtn) moreBtn.style.display = "none";
    return;
  }

  // 기본적으로 데이터는 50건 여기서 50건중에 데이터limit을 걸어놔서 12건
  // 하지만 더보기를 눌렀을 때도(누적) +12건이 되야 하므로 0 첫번쨰 자리부터 12건이 나오게
  const slicedData = data.slice(0, displayLimit);

  // 아직 안 보여준 데이터가 남아있으면 더보기 버튼 표시, 다 보여줬으면 숨김
  if (moreBtn) {
    if (displayLimit < data.length) {
      moreBtn.style.display = "block";
    } else {
      moreBtn.style.display = "none";
    }
  }

  //slice한 데이터를 동적으로 li태그에 삽입
  container.innerHTML = slicedData
    // img 템플릿에 loading="lazy" 추가 초기로딩 가볍게
    .map((item) => {
      return `
      <li>
        <a href="detail.html?num=${encodeURIComponent(item.num)}">
          <img src="${item.image}" alt="${item.species}" loading="lazy"/>
          <div class="card-info">
            <div class="badge-group">
              <span class="badge state">${item.state}</span>
              <span class="badge sex">${item.sexCd}</span>
            </div>
            <dl>
              <dt>품종</dt>
              <dd>${item.species}</dd>
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

// =================================================
// [6] 필터 모달 열기/닫기 제어
// =================================================
// filterBtn 그리고 모달팝업이 존재한다면
// 클릭이 관찰됐을 때 모달창 보여주기
if (filterBtn && modal) {
  filterBtn.addEventListener("click", () => modal.classList.add("show"));
}
if (closeBtn && modal) {
  closeBtn.addEventListener("click", () => modal.classList.remove("show"));
}
// 모달팝업이 있고 클릭이벤트를 줘서 e.target: 사용자가 클릭한 곳 추적이 모달 팝업 밖(modal)
// 이면 classlist로 remove를 줘서 show라는 클래스를 지워서 숨김
// css에서 show라는 클래스에 팝업을 보여주게 설정했음
// e.target === modal 조건이 없으면 모달 내부 아무 곳을 눌러도 닫힘
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
}

// =================================================
// [7] "최근 3개월" 조건을 날짜 input창에 자동으로 채워주는 함수
// =================================================
function applyThreeMonthsSetting() {
  const today = new Date(); // 오늘 날짜 객체 만들기
  // toISOString: 국제 표준 영어 날짜 string으로 바꾸기
  // ex: 2026-08-07T04:16:38.123Z로 출력
  // input창에 2026-08-07로 만들기 위해 T가 나오면 잘라줘
  // "0"의미는 잘라진 조각에서 앞에 부분을 출력해줘
  const endDateStr = today.toISOString().split("T")[0];

  const priorDate = new Date();
  // 현재 Month(달)에서 8월이라면 7에서 -3을 뺴서 출력해줘
  // 7-3 = 4 (즉 5월)
  priorDate.setMonth(priorDate.getMonth() - 3);
  const startDateStr = priorDate.toISOString().split("T")[0];

  if (startDateInput && endDateInput) {
    startDateInput.value = startDateStr;
    endDateInput.value = endDateStr;
  }

  if (recent3MonthsCheckbox) {
    recent3MonthsCheckbox.checked = true;
  }

  if (tagPeriod) {
    tagPeriod.textContent = "최근 3개월";
  }
}

// =================================================
// [8] 필터 모달 "검색하기" 버튼 -> 실제 필터링 실행
// =================================================
if (filterForm) {
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // formData: 폼 안의 모든 input/select값을 한 번에 읽어오는 내장 기능
    const formData = new FormData(filterForm);
    const selectedRegion = formData.get("region");
    const selectedSpecies = formData.get("species");
    const selectedStatus = formData.get("status");
    const selectedGender = formData.get("gender");
    const onlyProtect = formData.get("recent3Months");

    // 상단 최근 3개월 체크여부에 따라 갱신
    if (onlyProtect) {
      if (tagPeriod) tagPeriod.textContent = "최근 3개월";
    } else {
      if (tagPeriod) tagPeriod.textContent = "전체 기간";
    }

    // 상단 지역/축종 태그도 선택한 값으로 갱신 (선택 안했으면 기본 문구 유지)
    if (tagRegion) tagRegion.textContent = selectedRegion || "모든 지역";
    if (tagSpecies) tagSpecies.textContent = selectedSpecies || "모든 동물";

    // allProtectData(원본 전체)를 조건에 맞게 걸러서 currentFilteredData에 담는다.
    currentFilteredData = allProtectData.filter((item) => {
      // ----- 지역 조건 -----
      // select의 <option value="모든지역">은 공백이 없는 문자열이므로
      // 비교 문자열도 반드시 동일하게"모든지역"(공백 없음)으로 맞춰야 함.
      // (공백 불일치로 삽질함)
      const matchRegion =
        !selectedRegion ||
        selectedRegion === "모든지역" ||
        (item.loc && item.loc.includes(selectedRegion));

      // 축종
      const matchSpecies =
        !selectedSpecies ||
        selectedSpecies === "모든 동물" ||
        (item.species && item.species.includes(selectedSpecies));

      // 상태
      // select의 <option value="보호중">은 API의 실제 상태 값과 표기가
      // 다를 수 있어서 보호중과 보호로 select
      const targetStatus =
        selectedStatus === "보호중" ? "보호" : selectedStatus;
      const matchStatus =
        !selectedStatus ||
        selectedStatus === "전체" ||
        selectedStatus === "모든 상태" ||
        (item.state &&
          (item.state.includes(targetStatus) ||
            targetStatus.includes(item.state)));

      // 성별
      const matchGender =
        !selectedGender ||
        selectedGender === "전체" ||
        selectedGender === "성별미상" ||
        item.sexCd === selectedGender;

      // 날짜
      // <input type="date"> 의 값은 기본적으로 "2026-00-00"(하이픈이 포함됨) 형식이라
      // API의 happenDt는 "20260000"(하이픈이 없음) 그래서 replace로 처리
      // replace(문자열변환 처음것만)
      // replace만 쓰면 202600-00이 되어 버려서 정규표현식으로 /-/g 처리
      // "/.../"" 정규표현식 시작과 끝, "-" 하이픈을 찾아서, "g" 전역에서 싹 찾아서 "" 처리
      // 전처에서 하이픈을 찾아서 빈칸을 만든다.
      const matchDate =
        !startDateInput ||
        !endDateInput ||
        !startDateInput.value ||
        !endDateInput.value ||
        (item.date &&
          // 시작일 이후이면
          item.date >= startDateInput.value.replace(/-/g, "") &&
          // 종료일 이전이면
          item.date <= endDateInput.value.replace(/-/g, ""));

      // 5개의 조건을 모두 만족해야 최종으로 실행됨(AND연산자)
      return (
        matchRegion && matchSpecies && matchStatus && matchGender && matchDate
      );
    });

    displayLimit = 12;
    renderProtectsCards(currentFilteredData);

    if (modal) {
      modal.classList.remove("show");
    }
  });
}

// -------------------------------------------------------------
// [9] 상단 "최근 3개월" 태그 버튼 클릭 시
// -------------------------------------------------------------
if (tagPeriod) {
  tagPeriod.addEventListener("click", () => {
    applyThreeMonthsSetting(); // 날짜 입력창/체크박스를 3개월로 세팅(함수 재사용)
    if (filterForm) {
      filterForm.requestSubmit();
      // Submit 이벤트를 실행시켜서 [8번]로직 재활용
    }
  });
}

// -------------------------------------------------------------
// [10] 더보기 버튼 클릭 (이벤트 위임 방식)
// -------------------------------------------------------------
// document 전체에 클릭 이벤트를 하나만 걸어두고, 클릭된 대상이 .btn-more인지 확인하는 방식.
// -> 더보기 버튼이 나중에 새로 그려져도(카드 갱신시) 이벤트가 항상 유효함
document.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("btn-more")) {
    displayLimit += 12;
    renderProtectsCards(currentFilteredData);
  }
});

// -------------------------------------------------------------
// [11] 페이지 최초 진입 시 API 호출 및 초기 렌더링
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // api.js에서 정의된 함수 공공데이터 보호동물 조회
  showSkeleton(container, 12); // API 응답 대기 중 스켈레톤 표시
  const apiItems = await fetchProtectData();
  if (apiItems && apiItems.length > 0) {
    // API 원본 필드명과 매핑준비(desertionNo(공고번호), happenDt(구조 발견일?발생일)등)
    // 이름(name과 date등)을 매핑해서 allProtectData에 저장
    allProtectData = apiItems.map((item, index) => ({
      id: index + 1,
      state: item.processState, // 보호중 / 종료(입양)등
      sexCd: item.sexCd === "F" ? "암컷" : item.sexCd === "M" ? "수컷" : "미상",
      num: item.desertionNo, // 공고번호 (상세 페이지 이동할 때 넘김)
      date: item.happenDt, // 발생일 (YYYYMMDD)
      loc: item.orgNm, // 관할기간(지역)
      image: item.popfile1, // 이미지 1번
      species: item.kindFullNm, // 품종
      careNm: item.careNm, // 보호센터 이름
      careAddr: item.careAddr, // 보호센터 주소(지도 좌표 변환 사용)
      careTel: item.careTel, // 보호센터 전화번호
    }));

    // 렌더링전에 필터 없이 전체 데이터를 뿌려줌
    currentFilteredData = allProtectData;
    // 12개 갯수 제한
    displayLimit = 12;

    renderProtectsCards(currentFilteredData);
  } else {
    // API 응답이 비어있거나 할 떄 에러 방어
    showStateMessage(
      container,
      "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
    if (moreBtn) {
      moreBtn.style.display = "none";
    }
  }
});

// -------------------------------------------------------------
// [12] 상단 탭 전환 (보호동물 / 보호소 찾기 / 추천 입양 동물)
// -------------------------------------------------------------
const mapSection = document.getElementById("map-section"); // 지도 영역
const mainSection = document.querySelector(".main-section"); // 상단 지역 카드 영역
const bohoSection = document.querySelector(".boho-section"); // 보호동물 카드 목록 영역

// 전역 변수 선언(함수 안에서 선언하면 매번 리셋되기 때문에 함수 밖에서 전역 선언해줌)
let mapInitialized = false; // 최초 진입시엔 false (지도를 이미 한번 만들었는지 확인) 중복 방지
let map = null; // 카카오 지도API맵 인스턴스를 담을 변수(초기엔 없기때문에 null)

document.querySelectorAll(".protect-tab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    // 모든 protect-tab을 불러와서 클릭했을 때 새로고침 방지
    e.preventDefault();

    document
      .querySelectorAll(".protect-tab")
      // 모든 ptrotect-tab에서 forEach 반복문을 돌려 순차적으로 active라는 class가 있으면 삭제
      .forEach((t) => t.classList.remove("active"));
    // 클릭한 tab에만 다시 active기능을줌
    tab.classList.add("active");

    const selected = tab.dataset.tab; // protect || find || recommand

    // 보호소 찾기를 selected하면
    if (selected === "find") {
      // "보호소 찾기" 탭: 카드 목록을 숨기고 지도를 보여줌
      if (mainSection) mainSection.style.display = "none";
      if (bohoSection) bohoSection.style.display = "none";
      if (mapSection) mapSection.hidden = false;
      // 화면 렌더링
      renderShelterMap();
      // 그 외: 지도를 숨기고 카드목록을 다시 보여 줌
    } else {
      if (mainSection) mainSection.style.display = "";
      if (bohoSection) bohoSection.style.display = "";
      if (mapSection) mapSection.hidden = true;
    }
  });
});

// -------------------------------------------------------------
// [13] 카카오맵으로 보호소 위치 표시하는 함수
// -------------------------------------------------------------
let mapRetryCount = 0; // SDK 로드 대기 재시도 횟수 (무한 대기 방지)

function renderShelterMap() {
  const mapContainer = document.getElementById("shelter-map");
  if (!mapContainer) return;

  // 1. 카카오 SDK 스크립트 자체가 아직 안 붙었을 때만 재시도
  //    (autoload=false 이므로 kakao.maps.services / kakao.maps.Map 은
  //     아래 kakao.maps.load() 콜백 안에서야 사용 가능. 여기서 검사하면 무한 루프)
  if (typeof kakao === "undefined" || !kakao.maps || !kakao.maps.load) {
    if (mapRetryCount >= 25) {
      // 약 5초 대기해도 안 되면 SDK 로드 실패로 간주 (도메인 미등록/네트워크 등)
      mapContainer.innerHTML =
        "<p style='text-align:center; padding:40px; color:#888;'>지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
      return;
    }
    mapRetryCount++;
    setTimeout(renderShelterMap, 200); // 0.2초 후 다시 시도
    return;
  }
  mapRetryCount = 0;

  // 2. 카카오 SDK 로드 (이 콜백 안부터 services / Map 사용 가능)
  kakao.maps.load(function () {
    // 이미 만들어진 지도면 재생성 없이 크기/중심만 재조정
    if (mapInitialized) {
      setTimeout(() => {
        if (map) {
          map.relayout();
          map.setCenter(new kakao.maps.LatLng(36.5, 127.8));
        }
      }, 150);
      return;
    }

    // --- 3. 보호소 주소 중복 제거 ---
    const uniqueShelters = [];

    allProtectData.forEach((item) => {
      if (!item.careAddr) return;
      const foundShelter = uniqueShelters.find(
        (shelter) => shelter.addr === item.careAddr,
      );

      if (!foundShelter) {
        uniqueShelters.push({
          name: item.careNm,
          addr: item.careAddr,
          tel: item.careTel,
        });
      }
    });

    if (uniqueShelters.length === 0) {
      mapContainer.innerHTML =
        "<p style='text-align:center; padding:40px; color:#888;'>표시할 보호소 데이터가 없습니다.</p>";
      return;
    }

    // --- 4. 지도 초기화 ---
    map = new kakao.maps.Map(mapContainer, {
      center: new kakao.maps.LatLng(36.5, 127.8),
      level: 12,
    });
    mapInitialized = true;

    // --- 5. 주소 → 좌표 변환 후 마커 찍기 ---
    const geocoder = new kakao.maps.services.Geocoder();
    const bounds = new kakao.maps.LatLngBounds();
    let currentInfowindow = null;
    let completedCount = 0;

    uniqueShelters.forEach((shelter) => {
      geocoder.addressSearch(shelter.addr, (result, status) => {
        completedCount++;

        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
          const marker = new kakao.maps.Marker({ map, position: coords });

          bounds.extend(coords);

          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:8px; font-size:13px; white-space:nowrap;">
                      <strong>${shelter.name}</strong><br/>
                      ${shelter.tel || "전화번호 정보 없음"}
                    </div>`,
          });

          kakao.maps.event.addListener(marker, "click", () => {
            if (currentInfowindow === infowindow) {
              infowindow.close();
              currentInfowindow = null;
            } else {
              if (currentInfowindow) currentInfowindow.close();
              infowindow.open(map, marker);
              currentInfowindow = infowindow;
            }
          });
        }

        if (completedCount === uniqueShelters.length) {
          if (!bounds.isEmpty()) {
            map.setBounds(bounds);
          }
        }
      });
    });
  });
}
