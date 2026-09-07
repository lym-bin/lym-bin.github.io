// ==========================================================
// stats.js — 유기동물 처리 현황 통계 페이지
// rescueAnimalStats API
// 가로 막대(순수 HTML/CSS, 막대 길이 = 최댓값 대비 %)로 렌더링.
// 안락사율/입양류 분모 = 보호소가 생사를 결정한 건수 (입양+반환++기증+안락사).
// 자연사, 방사, 미포획, 보호중 제외 -> 공공데이터 chart2(시도별 안락사율)과 동일
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const periodEl = document.querySelector("#stats-period"); // 공고 기간
  const summaryEl = document.querySelector("#stats-summary"); // 요약 타일3개
  const outcomeChart = document.querySelector("#outcome-chart"); // 처리결과 막대차트
  const outcomeTable = document.querySelector("#outcome-table"); // 표(접근성용)
  const regionChart = document.querySelector("#region-chart"); // 시도별 안락사율 막대차트
  const regionTable = document.querySelector("#region-table"); // 표

  const LOOKBACK = 12; // 최근 12개월 (상수로 빼서 재사용)
  const data = await fetchAnimalStats(LOOKBACK); // api.js 호출

  if (!data || data.length === 0) {
    // api실패 방어
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

  // --- chart1: 처리 결과별 마리 수(보호중/입양/반환/기증/지연사/안락사) ---
  const outcomes = data
    .filter((d) => d.se === "chart1") // 전체 통계 중 chart1 행만
    .map((d) => ({ name: d.prcsNm, value: Number(d.tot) || 0 }))
    .sort((a, b) => b.value - a.value); // 마리 수 내림차순(많은 순)
  const total = outcomes.reduce((sum, o) => sum + o.value, 0); // 전체 구조 마리수 = 다 더함
  // 이름으로 마리 수 꺼내는 헬퍼 (내장 Object.prototype.valueOf 와 겹치지 않게 countOf)
  const countOf = (name) => outcomes.find((o) => o.name === name)?.value || 0;

  // 입양률·안락사율 분모 = 보호소가 생사를 "결정"한 건수 (입양+반환+기증+안락사).
  // 자연사·방사·미포획·보호중 제외 → 공공데이터 chart2(시도별 안락사율)와 동일 기준.
  const decided =
    countOf("입양") + countOf("반환") + countOf("기증") + countOf("안락사");

  // 요약 타일 3개 데이터
  renderSummary(summaryEl, [
    { label: "총 구조", value: total.toLocaleString(), unit: "마리" },
    {
      label: "입양률",
      value: decided ? ((countOf("입양") / decided) * 100).toFixed(1) : "0",
      unit: "%",
      tone: "good",
      note: "입양 · 반환 · 기증 · 안락사 대비",
    },
    {
      label: "안락사율",
      value: decided ? ((countOf("안락사") / decided) * 100).toFixed(1) : "0",
      unit: "%",
      tone: "bad",
      note: "입양 · 반환 · 기증 · 안락사 대비",
    },
  ]);

  // 막대 차트: outcoms 데이터 + 옵션 객체
  renderBarChart(outcomeChart, outcomes, {
    max: outcomes[0]?.value || 0,
    // 값 표시 형식 (콜백으로 주입)
    format: (v) => `${v.toLocaleString()}마리`,
  });
  renderTable(
    outcomeTable,
    ["처리 결과", "마리 수", "비중"], // 표 헤더
    outcomes.map((o) => [
      // 각 행 = [이름, 마리수, 비율]. total 0이면 NaN% 방지
      o.name,
      o.value.toLocaleString(),
      `${total ? ((o.value / total) * 100).toFixed(1) : "0"}%`,
    ]),
  );

  // --- chart2: 시도별 안락사율 ---
  const regions = data
    .filter((d) => d.se === "chart2")
    // {name: "서울" , value: 12.3}
    .map((d) => ({ name: d.prcsNm, value: Number(d.tot) || 0 }))
    // 안락사율 높은 시 도부터
    .sort((a, b) => b.value - a.value);

  renderBarChart(regionChart, regions, {
    // 최대값 = 정렬 첫 번째 (막대 길이 기준)
    max: regions[0]?.value || 0,
    // chart1은 "마리", chart2는 %
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
// 세번째 인자(barClass)를 객체 구조분해로 받음. barClass는 안주면 ""
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
// titles= [{label, value, unit ....d}]
function renderSummary(container, tiles) {
  if (!container) return;
  container.innerHTML = tiles
    .map((t) => {
      // 조건부 클래스: tone 있으면 "sum-tile sum-tile--good", 없으면 "sum-tile"
      const cls = ["sum-tile", t.tone && `sum-tile--${t.tone}`]
        .filter(Boolean)
        .join(" ");
      return `
    <div class="${cls}">
      <span class="sum-label">${t.label}</span>
      <span class="sum-value">${t.value}<span class="unit">${t.unit}</span></span>
      ${t.note ? `<span class="sum-note">${t.note}</span>` : ""}
    </div>`;
    })
    .join("");
}

// 접근성용 표 (details/summary 안에 표시)
// headers = ["시도", "안락사율"]
// row = {["서울", "12.3&"], ["부산", "9.1"]}...
function renderTable(container, headers, rows) {
  if (!container) return;
  // 헤더: ["시도","안락사율"] → "<th>시도</th><th>안락사율</th>"
  const headHtml = headers.map((h) => `<th>${h}</th>`).join("");
  // 본문: 행마다 <tr>, 행 안 셀마다 <td>
  const bodyHtml = rows
    .map((r) => {
      const cells = r.map((c) => `<td>${c}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  container.innerHTML = `<thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody>`;
}
