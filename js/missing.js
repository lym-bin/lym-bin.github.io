// =====================================================
// missing.js - 메인페이지 "실종/제보 동물" 영역 렌더링
// 데이터(MISSING_REPORTS)는 js/mock-data.js 에 있음 (API 없는 섹션)
// mock-data.js → missing.js 순서로 로드
// =====================================================

// MISSING_REPORTS 배열을 카드 HTML 문자열로 변환한 뒤 하나로 합침
const missingCards = MISSING_REPORTS
  .map((item) => {
    // item : 실종/제보 글 하나
    // 삼항연산자로 실종/제보에 따라 뱃지 색상 클래스를 다르게 부여
    // (CSS의 .missing-badge / .report-badge 참고)
    return `
    <li>
      <div class="miss-card">
        <div class="miss-img-wrap">
          <img src="${item.image}" alt="${item.breed} (${item.color})" onerror="imgError(this)">
          <span class="badge ${item.type === "실종" ? "missing-badge" : "report-badge"}">${item.type}</span>
        </div>
        <span class="card-species">${item.breed}</span>
        <span class="card-meta">${item.region} · ${item.color}</span>
      </div>
    </li>
  `;
  })
  .join(""); // 배열의 문자열들을 구분자 없이 하나로 이어붙임

// [3] 완성된 카드 HTML을 화면에 삽입
const missList = document.querySelector(".miss-list");
if (missList) missList.innerHTML = missingCards;
