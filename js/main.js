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
