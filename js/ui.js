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

// 이미지 로드 실패 시 대체할 회색 플레이스홀더 (별도 파일 불필요, data URI)
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23eeeeee'/%3E%3Ctext x='50%25' y='50%25' fill='%23aaaaaa' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'%3E이미지 준비 중%3C/text%3E%3C/svg%3E";

/**
 * <img> 로드 실패 콜백. 템플릿에 onerror="imgError(this)" 로 연결.
 * @param {HTMLImageElement} el
 */
function imgError(el) {
  el.onerror = null; // 플레이스홀더도 실패할 경우 무한 루프 방지
  el.src = PLACEHOLDER_IMG;
}

/**
 * 목록 API 원본 데이터를 공고번호(desertionNo) 키로 sessionStorage에 캐시.
 * 상세 페이지가 목록에서 넘어온 경우 재요청 없이 이 캐시를 사용한다.
 * @param {Array} items - fetchProtectData / fetchAnimalsList 결과 배열
 */
function cacheAnimals(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const cache = JSON.parse(sessionStorage.getItem("animalCache") || "{}");
    items.forEach((item) => {
      if (item && item.desertionNo) cache[item.desertionNo] = item;
    });
    sessionStorage.setItem("animalCache", JSON.stringify(cache));
  } catch {
    // 용량 초과 등으로 실패해도 무시 (상세 페이지에 API fallback이 있음)
  }
}

// 현재 보고 있는 페이지에 해당하는 헤더 nav 링크를 강조 표시
(function markCurrentNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav .nav-item").forEach((link) => {
    if (link.getAttribute("href") === current) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });
})();

// 화면 상단에 잠깐 떴다 사라지는 토스트 알림 (alert 대체)
let _toastTimer = null;
function showToast(message, type = "info") {
  let box = document.querySelector(".toast");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast";
    box.setAttribute("role", "status");
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.classList.toggle("toast--error", type === "error");
  // 재트리거 시 애니메이션이 다시 돌도록 리플로우 강제
  void box.offsetWidth;
  box.classList.add("toast--show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => box.classList.remove("toast--show"), 2500);
}
