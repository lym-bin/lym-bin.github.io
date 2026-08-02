// js/main.js

console.log("main.js 파일이 정상적으로 로드되었습니다!");
// 웹 페이지의 HTML(DOM)이 모두 로드 완료되면 실행하라는 명령
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM 로드 완료!");

  // -------------------------------------------------------------
  // [1단계] 화면 왼쪽에 "26.07.25 유기동물 통계" 텍스트 만들기
  // ----------------------------------------------
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2); // "2026"의 뒤 2자리만-> "26"
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // 월 -> "07"
  const dd = String(today.getDate()).padStart(2, "0"); // 일 -> "25"

  // HTML에서 id="stats-date"를 가진 h2 태그를 찾아옴
  const statsDateEl = document.getElementById("stats-date");
  if (statsDateEl) {
    // h2 태그 내부 글자를 "26.07.25 유기동물 통계"로 바꿔줌.
    statsDateEl.textContent = `${yy}.${mm}.${dd} 유기동물 통계`;
  }

  // -------------------------------------------------------------
  // [2단계] api.js에 정의했던 [비동기작업]etchAnimalStats()를 불러와 데이터 가져오기
  // ---------------------------
  // API에서 데이터를 완전히 가져올 때까지 await로 잠깐 기다렸다가 statsData에 담음.
  const statsData = await fetchAnimalStats();
  console.log("API 결과:", statsData);

  // 데이터가 잘 들어왔다면
  if (statsData && statsData.length > 0) {
    const latestData = statsData[0]; // 데이터 배열의 0번째(첫 번째 데이터) 선택
    console.log("최종 선택된 통계 데이터:", latestData);
    // 숫자를 출력해 줄 HTML 태그 3개를 가져옴
    const totCntEl = document.getElementById("totCnt");
    const adoptRateEl = document.getElementById("adoptRate");
    const euthanasiaRateEl = document.getElementById("euthanasiaRate");

    // -------------------------------------------------------------
    // [3단계] [동기 작업]구조 마리 수에 천 단위 쉼표(,) 적용해서 화면에 출력
    // -------------------------------------------------------------
    if (totCntEl) {
      const rawTot = Number(latestData.tot ?? 0);
      totCntEl.textContent = rawTot.toLocaleString(); // 예: 7322 -> 7,322
    }

    // -------------------------------------------------------------
    // [4단계] 배열에서 '입양'과 '안락사' 수치 찾아서 출력
    // -------------------------------------------------------------
    const adoptItem = statsData.find(
      (item) => item.prcsNm === "입양" || item.se === "adopt",
    );
    const euthanasiaItem = statsData.find(
      (item) => item.prcsNm === "안락사" || item.se === "euthanasia",
    );
    // 입양률 화면 변경 (찾은 데이터가 있으면 그 값을, 없으면 0 출력)
    if (adoptRateEl) {
      adoptRateEl.textContent = adoptItem
        ? (adoptItem.tot ?? "0")
        : (latestData.adoptRate ?? "0");
    }
    // 안락사율 화면 변경
    if (euthanasiaRateEl) {
      euthanasiaRateEl.textContent = euthanasiaItem
        ? (euthanasiaItem.tot ?? "0")
        : (latestData.euthanasiaRate ?? "0");
    }

    console.log("화면에 데이터 출력 완료!");
  } else {
    console.warn("데이터가 비어있습니다.");
  }
});

//지역별 버튼으로 배열리스트 필터링

// ==========================================
// [1단계] 데이터를 뿌려줄 부모 컨테이너(DOM) 선택하기
// ==========================================
const listContainer = document.getElementById("today-dummy");

// ==========================================
// [2단계] 사용자가 클릭할 지역 버튼들 모두 가져오기 (NodeList 반환)
// ==========================================
const regionButtons = document.querySelectorAll("#today-region");

// ==========================================
// [3단계] 사용할 원본 더미데이터(데이터베이스 역할) 정의하기
// ==========================================
const rescueAnimals = [
  {
    region: "군산시",
    kindCd: "강아지",
    sexCd: "M",
    age: "2024년생",
    popfile: "images/todaycard_1.svg",
  },
  {
    region: "창원시",
    kindCd: "고양이",
    sexCd: "F",
    age: "2022년생",
    popfile: "images/todaycard_2.svg",
  },
  {
    region: "가평군",
    kindCd: "강아지",
    sexCd: "M",
    age: "2022년생",
    popfile: "images/todaycard_3.svg",
  },
];

// ==========================================
// [4단계] 데이터를 받아서 화면에 HTML 카드로 그려주는 렌더링 함수 정의하기
// ==========================================
function renderAnimals(data) {
  // 4-1. 새로운 데이터가 들어오기 전, 기존에 있던 리스트 내용을 싹 비워 초기화
  listContainer.innerHTML = "";

  // 4-2. 만약 전달된 데이터가 비어있다면(조건에 맞는 동물이 없다면) 안내 문구 출력 후 종료
  if (data.length === 0) {
    listContainer.innerHTML =
      "<li>해당 지역에 등록된 동물 데이터가 없습니다.</li>";
    return;
  }

  console.log("여기오냐"); // 함수가 정상적으로 실행되는지 확인용 로그

  // 4-3. 데이터 배열을 순회(forEach)하며 각각의 동물 정보를 HTML 문자열로 조립
  data.forEach((animal) => {
    const cardHTML = `
      <li>
        <a href="">
          <img src="${animal.popfile}" alt="강아지1">
          <span>품종: ${animal.kindCd}</span>
          <span>성별: ${animal.sexCd}</span>
          <span>나이: ${animal.age}</span>
        </a>
      </li>
    `;

    // 4-4. 조립된 HTML 카드를 부모 컨테이너(ul) 내부의 기존 내용 뒤에 차곡차곡 추가
    listContainer.innerHTML += cardHTML;
  });
}

// ==========================================
// [5단계] 페이지가 처음 켜졌을 때 전체 데이터를 화면에 기본 출력하기
// ==========================================
renderAnimals(rescueAnimals);

// ==========================================
// [6단계] 지역 버튼들에 클릭 이벤트(EventListener)를 각각 걸어주기
// ==========================================
regionButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    // 6-1. a 태그나 버튼 고유의 기본 동작(페이지 새로고침 등) 막기
    e.preventDefault();

    // 6-2. 사용자가 클릭한 버튼의 텍스트 가져오기 (예: "군산시", 양옆 공백 제거)
    const selectedRegion = e.target.textContent.trim();

    // 6-3. 전체 더미데이터 중에서 클릭한 지역(`animal.region`)과 일치하는 데이터만 걸러내기(filter)
    const filteredData = rescueAnimals.filter(
      (animal) => animal.region === selectedRegion,
    );

    // 6-4. 필터링된 데이터만 렌더링 함수에 넘겨주어 화면을 새롭게 갱신하기
    renderAnimals(filteredData);
  });
});
