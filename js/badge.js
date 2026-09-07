// ==========================================================
// badge.js — 유기동물 상태 문자열 → 그룹명 / 뱃지 CSS 클래스
// search.html, shelter.html 에서 페이지 스크립트보다 먼저 로드
// ==========================================================

// API 상태값("종료(자연사)", "공고중" 등)을 부분 문자열로 판정
const STATE_RULES = [
  { keywords: ["긴급"], group: "긴급", badge: "badge-red" },
  { keywords: ["종료", "완료"], group: "종료", badge: "badge-green" },
];
const STATE_DEFAULT = { group: "보호중", badge: "badge-blue" };

function matchStateRule(state = "") {
  return (
    STATE_RULES.find((r) => r.keywords.some((k) => state.includes(k))) ||
    STATE_DEFAULT
  );
}

// 상태값 → 3개 그룹 중 하나 (필터용)
function getStatusGroup(state) {
  return matchStateRule(state).group;
}

// 상태값 → 뱃지 색상 클래스 (badge-red / badge-green / badge-blue)
function getBadgeClass(state) {
  return matchStateRule(state).badge;
}
