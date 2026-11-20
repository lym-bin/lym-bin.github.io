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
    sex: item.sex || "성별 미상",
    age: item.age || "나이 미상",
    date: item.date || "실종일 미상",
  }));

  // 실종(API) 4장 + 제보(예시) → 기존 템플릿으로 렌더
  missList.innerHTML = [...lostCards, ...MISSING_REPORTS]
    .map((item, i) => {
      const inner = `<span class="miss-img-wrap">
        <img src="${item.image}" alt="${item.breed} (${item.color})" onerror="imgError(this)">
        <span class="badge ${item.type === "실종" ? "missing-badge" : "report-badge"}">${item.type}</span>
      </span>
      <span class="card-species">${item.breed}</span>
      <span class="card-meta">${item.region} · ${item.color}</span>`;

      // 실종(실제 데이터)만 눌러서 자세히 보기, 제보(예시)는 클릭 없음
      return item.type === "실종"
        ? `<li><button type="button" class="miss-card card-open-btn" data-index="${i}" aria-haspopup="dialog">${inner}</button></li>`
        : `<li><div class="miss-card">${inner}</div></li>`;
    })
    .join("");

  // 목록에 리스너 하나: 클릭된 곳에서 가장 가까운 카드 버튼을 찾음
  missList.addEventListener("click", (e) => {
    const btn = e.target.closest(".card-open-btn"); // 카드 버튼 클래스
    if (!btn) return; // 제보 카드나 빈 곳 클릭
    const item = lostCards[Number(btn.dataset.index)]; // data-index → 숫자로
    openAnimalDialog({
      image: item.image,
      title: item.breed,
      badge: "실종",
      badgeType: "lost",
      rows: [
        ["성별", toSexLabel(item.sex)],
        ["나이", item.age || "미상"],
        ["분실일", formatYmd(item.date)], // "20261118" → "26.11.18" (ui.js에 있는 함수)
        ["지역", item.region],
        ["색", item.color],
      ],
      noteHtml:
        '보호자 연락처는 개인정보 보호를 위해 표시하지 않습니다. <a href="https://www.animal.go.kr/front/awtis/loss/lossList.do?menuNo=1000100000" target="_blank" rel="noopener">국가동물보호정보시스템 분실 신고</a>에서 확인하세요.',
    });
  });
});
