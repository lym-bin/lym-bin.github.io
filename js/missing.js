// =====================================================
// missing.js - 메인페이지 "실종/제보 동물" 영역 렌더링
// 역할: 더미데이터를 카드 html로 변환해서 화면에 뿌려준다.
// * : 초기에만 더미데이터를 뿌려 놓고 api데이터를 뿌릴려 했지만
//     (실제 사이트도 사용자가 등록하는 영역쪽이라 더미쓰기로함)
// ====================================================

// [1] 더미데이터 - 실제로는 사용자가 등록한 실종/제보 글이 들어올 자리
const missingData = [
  {
    id: 1,
    type: "실종",
    region: "가평군",
    breed: "포메라니안",
    color: "갈색/흰색",
    image: "images/missing_1.png",
  },
  {
    id: 2,
    type: "제보",
    region: "마포구",
    breed: "강아지",
    color: "흰색",
    image: "images/missing_2.png",
  },
  {
    id: 3,
    type: "실종",
    region: "구로구",
    breed: "말티즈",
    color: "흰색",
    image: "images/missing_3.png",
  },
  {
    id: 4,
    type: "실종",
    region: "수원특례시",
    breed: "고양이",
    color: "고등어색",
    image: "images/missing_4.png",
  },
  {
    id: 5,
    type: "실종",
    region: "부산광역시",
    breed: "웰시코기",
    color: "흰색/갈색",
    image: "images/missing_5.png",
  },
];

// [2] 배열 (missingData)을 카드 HTML 문자열 배열로 변환한 뒤 하나로 합침
const missingCards = missingData
  .map((item) => {
    // 삼항연산자로 실종/제보에 따라 뱃지 색상 클래스를 다르게 부여
    // (CSS의 .missing-badge / .report-badge 참고)
    return `
    <li>
      <a href="#">
        <div class="miss-img-wrap">
          <img src="${item.image}" alt="${item.breed} (${item.color})" onerror="imgError(this)">
          <span class="badge ${item.type === "실종" ? "missing-badge" : "report-badge"}">${item.type}</span>
        </div>
        <span class="card-species">${item.breed}</span>
        <span class="card-meta">${item.region} · ${item.color}</span>
      </a>
    </li>
  `;
  })
  .join(""); // 배열의 문자열들을 구분자 없이 하나로 이어붙임

// [3] 완성된 카드 HTML을 실제 화면 (.miss-list)에 삽입
document.querySelector(".miss-list").innerHTML = missingCards;
