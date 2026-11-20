// =====================================================
// missing.js - 메인 "실종/제보 동물" 영역
// 실종: 분실동물 API (서버 함수 경유, 최근 30일, 보호자 정보 제외)
// 제보: mock-data.js 예시 (사용자가 작성하는 글이라 백엔드가 필요해 예시로 유지)
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  const missList = document.querySelector(".miss-list");
  if (!missList) return;

  showSkeleton(missList, 5); // 기다리는 동안

  let lost; // try 밖에서도 쓰려고 바깥에 선언
  try {
    lost = await fetchLostAnimals();
  } catch {
    // api.js가 이미 console.error로 남김
    showStateMessage(
      missList,
      "실종 동물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
    return;
  }

  if (lost.length === 0) {
    showStateMessage(
      missList,
      "최근 30일 동안 등록된 실종 신고가 없습니다.",
      "empty",
    );
    return;
  }

  // API 모양 → 기존 카드 모양으로 맞추기 (아래 템플릿을 그대로 쓰려고)
  const lostCards = lost.slice(0, 4).map((item) => ({
    type: "실종",
    breed: item.kind || "품종 미상",
    region: item.region || "지역 미상",
    color: item.color || "색상 미상",
    image: item.image || "",
  }));

  // 실종(API) 4장 + 제보(예시) → 기존 템플릿으로 렌더
  missList.innerHTML = [...lostCards, ...MISSING_REPORTS]
    .map((item) => {
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
    .join("");
});
