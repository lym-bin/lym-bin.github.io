// ==========================================================
// ui.js — 공통 UI 상태 헬퍼
// 역할: API 응답을 기다리는 동안(로딩), 결과가 없을 때(빈 상태),
//       요청이 실패했을 때(에러) 보여줄 화면 조각을 한 곳에서 관리.
// 사용: api.js / 페이지 스크립트보다 먼저 로드 (전역 함수로 노출)
// ==========================================================

/**
 * 로딩 스켈레톤 렌더
 * @param {HTMLElement} container - 카드가 그려질 <ul> 등
 * @param {number} count - 표시할 스켈레톤 카드 개수
 */
function showSkeleton(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count })
    .map(() => `<li class="skeleton-card" aria-hidden="true"></li>`)
    .join("");
}

/**
 * 안내 메시지 1줄 렌더 (빈 결과 / 에러 공용)
 * @param {HTMLElement} container
 * @param {string} message - 사용자에게 보여줄 문구
 * @param {"empty"|"error"} type
 */
function showStateMessage(container, message, type = "empty") {
  if (!container) return;
  const cls =
    type === "error"
      ? "state-message state-message--error"
      : "state-message";
  container.innerHTML = `<li class="${cls}" role="status">${message}</li>`;
}
