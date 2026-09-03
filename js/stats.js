// ==========================================================
// stats.js — 유기동물 처리 현황 통계 페이지
// rescueAnimalStats API
// 가로 막대(순수 HTML/CSS, 막대 길이 = 최댓값 대비 %)로 렌더링.
// 안락사율/입양류 분모 = 보호소가 생사를 결정한 건수 (입양+반환++기증+안락사).
// 자연사, 방사, 미포획, 보호중 제외 -> 공공데이터 chart2(시도별 안락사율)과 동일
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const periodEl = document.getElementById("stats-period");
  const summaryEl = document.getElementById("stats-summary");
  const outcomeChart = document.getElementById("outcome-chart");
  const outcomeTable = document.getElementById("outcome-table");
  const regionChart = document.getElementById("region-chart");
  const regionTable = document.getElementById("region-table");

  const LOOKBACK = 12; // 최근 12개월 누적
  const data = await fetchAnimalStats(LOOKBACK);

  if (!data || data.length === 0) {
    if (periodEl) periodEl.textContent = "통계 데이터를 불러오지 못했습니다.";
    showStateMessage(
      outcomeChart,
      "통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      "error",
    );
    return;
  }

  // --- 기간 라벨 ---
  const now = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - LOOKBACK);
  const ym = (d) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (periodEl) {
    periodEl.textContent = `${ym(from)} ~ ${ym(now)} · 전국 누적 (공공데이터포털 유기동물 조회)`;
  }

  // --- chart1: 처리 결과별 마리 수 ---
  const outcomes = data
    .filter((d) => d.se === "chart1")
    .map((d) => ({ name: d.prcsNm, value: Number(d.tot) || 0 }))
    .sort((a, b) => b.value - a.value);
  const total = outcomes.reduce((sum, o) => sum + o.value, 0);
  const valueOf = (name) => outcomes.find((o) => o.name === name)?.value || 0;
  // 입양률·안락사율 분모 = 보호소가 생사를 결정한 건수 (입양+반환+기증+안락사).
  // 자연사·방사·미포획·보호중 제외 → 공공데이터 chart2(시도별 안락사율)와 동일 기준.
  const decided =
    valueOf("입양") + valueOf("반환") + valueOf("기증") + valueOf("안락사");

  renderSummary(summaryEl, [
    { label: "총 구조", value: total.toLocaleString(), unit: "마리" },
    {
      label: "입양률",
      value: decided ? ((valueOf("입양") / decided) * 100).toFixed(1) : "0",
      unit: "%",
      tone: "good",
      note: "입양 · 반환 · 기증 · 안락사 대비",
    },
    {
      label: "안락사율",
      value: decided ? ((valueOf("안락사") / decided) * 100).toFixed(1) : "0",
      unit: "%",
      tone: "bad",
      note: "입양 · 반환 · 기증 · 안락사 대비",
    },
  ]);

  renderBarChart(outcomeChart, outcomes, {
    max: outcomes[0]?.value || 0,
    format: (v) => `${v.toLocaleString()}마리`,
  });
  renderTable(
    outcomeTable,
    ["처리 결과", "마리 수", "비중"],
    outcomes.map((o) => [
      o.name,
      o.value.toLocaleString(),
      `${((o.value / total) * 100).toFixed(1)}%`,
    ]),
  );

  // --- chart2: 시도별 안락사율 ---
  const regions = data
    .filter((d) => d.se === "chart2")
    .map((d) => ({ name: d.prcsNm, value: Number(d.tot) || 0 }))
    .sort((a, b) => b.value - a.value);

  renderBarChart(regionChart, regions, {
    max: regions[0]?.value || 0,
    format: (v) => `${v.toFixed(1)}%`,
    barClass: "is-eol",
  });
  renderTable(
    regionTable,
    ["시도", "안락사율"],
    regions.map((r) => [r.name, `${r.value.toFixed(1)}%`]),
  );
});

// 가로 막대 차트 렌더 (막대 길이 = 최댓값 대비 %)
function renderBarChart(container, rows, { max, format, barClass = "" }) {
  if (!container) return;
  container.innerHTML = rows
    .map((row) => {
      const pct = max ? (row.value / max) * 100 : 0;
      return `
      <li class="bar-row" title="${row.name} ${format(row.value)}">
        <span class="bar-label">${row.name}</span>
        <span class="bar-track">
          <span class="bar-fill ${barClass}" style="width:${pct.toFixed(1)}%"></span>
        </span>
        <span class="bar-value">${format(row.value)}</span>
      </li>`;
    })
    .join("");
}

// 요약 타일 3개
function renderSummary(container, tiles) {
  if (!container) return;
  container.innerHTML = tiles
    .map(
      (t) => `
    <div class="sum-tile${t.tone ? " sum-tile--" + t.tone : ""}">
      <span class="sum-label">${t.label}</span>
      <span class="sum-value">${t.value}<em>${t.unit}</em></span>
      ${t.note ? `<span class="sum-note">${t.note}</span>` : ""}
    </div>`,
    )
    .join("");
}

// 접근성용 표 (details/summary 안에 표시)
function renderTable(container, headers, rows) {
  if (!container) return;
  container.innerHTML =
    `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
    `<tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("")}</tbody>`;
}
