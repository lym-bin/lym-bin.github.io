// ==========================================================
// mock-data.js — API가 없는 메인 페이지 섹션들의 콘텐츠
// (입양후기 / 기부챌린지 / 실종·제보는 사용자 등록 영역이라 백엔드 없음)
// index.html에서 main.js / missing.js 보다 먼저 로드
// ==========================================================

// 베스트 입양후기 (main.js)
const ADOPTION_REVIEWS = [
  { name: "초코", afterImg: "images/dog_2.jpg", beforeImg: "images/dog_1.jpg" },
  { name: "구름", afterImg: "images/dog_4.jpg", beforeImg: "images/dog_3.jpg" },
  { name: "쵸파", afterImg: "images/dog_6.jpg", beforeImg: "images/dog_5.jpg" },
  { name: "가을", afterImg: "images/cat_2.jpg", beforeImg: "images/cat_1.jpg" },
];

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

// 실종/제보 (missing.js)
const MISSING_REPORTS = [
  { id: 1, type: "실종", region: "가평군", breed: "포메라니안", color: "갈색/흰색", image: "images/missing_1.jpg" },
  { id: 2, type: "제보", region: "마포구", breed: "강아지", color: "흰색", image: "images/missing_2.jpg" },
  { id: 3, type: "실종", region: "구로구", breed: "말티즈", color: "흰색", image: "images/missing_3.jpg" },
  { id: 4, type: "실종", region: "수원특례시", breed: "고양이", color: "고등어색", image: "images/missing_4.jpg" },
  { id: 5, type: "실종", region: "부산광역시", breed: "웰시코기", color: "흰색/갈색", image: "images/missing_5.jpg" },
];
