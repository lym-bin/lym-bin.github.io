// ==========================================================
// mock-data.js — API가 없는 메인 페이지 섹션들의 예시 데이터
// (기부챌린지 / 제보: 사용자 등록 영역이라 백엔드가 필요해 예시 데이터로 유지)
// index.html에서 main.js / missing.js 보다 먼저 로드
// ==========================================================

// 기부 챌린지 (main.js)
const DONATION_CHALLENGES = [
  {
    title: "여름나기 물품 지원",
    desc: "더위에 힘든 아이들에게 용품을",
    current: 3200000,
    goal: 5000000,
    image: "images/donation_1.jpg",
  },
  {
    title: "중성화 수술 지원",
    desc: "유기를 막기 위한 필수 수술비",
    current: 1800000,
    goal: 5000000,
    image: "images/donation_2.jpg",
  },
  {
    title: "긴급 치료비 기금",
    desc: "다치고 아픈 아이들의 수술비 모금",
    current: 4100000,
    goal: 5000000,
    image: "images/donation_3.jpg",
  },
];

// 제보 예시(사용자가 직접 제보하는 글이라 백엔드 연동필요, 실종은 API로)
const MISSING_REPORTS = [
  {
    id: 2,
    type: "제보",
    region: "마포구",
    breed: "강아지",
    color: "흰색",
    image: "images/missing_2.jpg",
  },
];
