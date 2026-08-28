// ================================================
// detail.js - 유기동물 상세 페이지
// 역할: URL 쿼리스트링(?num=...)의 공고번호로 동물 한 마리를 찾아 렌더링.
// 데이터 출처 (순서대로):
//   1) sessionStorage 캐시 — search/shelter 목록에서 넘어온 경우 이미 저장돼 있어 즉시 사용
//   2) 캐시에 없으면(새로고침/직접 URL 접근) 전체 목록을 받아 find()
//   ※ 공공데이터 API는 desertionNo 단건 조회를 지원하지 않음(파라미터를 줘도 목록 반환)
// ================================================

// 목록 페이지에서 저장해 둔 원본 동물 데이터를 공고번호로 꺼낸다.
function getCachedAnimal(num) {
  try {
    const cache = JSON.parse(sessionStorage.getItem("animalCache") || "{}");
    return cache[num] || null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // [1] 주소창의 쿼리스트링에서 공고번호(num) 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const targetNum = urlParams.get("num");

  if (!targetNum) {
    showDetailError("잘못된 접근입니다. 공고번호가 없습니다.");
    return;
  }

  // [2] 캐시 먼저 확인 (목록 → 상세 이동이면 여기서 끝, 네트워크 요청 없음)
  let currentAnimal = getCachedAnimal(targetNum);

  // [3] 캐시에 없으면 전체 목록을 받아 find (새로고침 / 직접 URL 접근 대비)
  if (!currentAnimal) {
    const apiItems = await fetchProtectData({ numOfRows: 1000 });

    if (!apiItems || apiItems.length === 0) {
      showDetailError("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // String()으로 감싸는 이유: desertionNo 타입이 섞여 와도 안전하게 문자열 비교
    currentAnimal = apiItems.find(
      (item) => String(item.desertionNo) === String(targetNum),
    );
  }

  if (!currentAnimal) {
    showDetailError("해당하는 유기동물 정보를 찾을 수 없습니다.");
    return;
  }

  // [4] 찾은 데이터를 화면에 뿌려주기
  renderAnimalDetail(currentAnimal);
});

// 상세 페이지 진입 자체가 실패한 경우, 본문을 에러 안내로 교체
function showDetailError(message) {
  const wrap = document.querySelector(".shelter-detail") || document.body;
  wrap.innerHTML = `
    <div class="page-error" role="alert">
      <p>${message}</p>
      <a href="search.html">동물 검색으로 돌아가기</a>
    </div>`;
}

// ==============================================
// 상세 정보(이미지 갤러리 info)를 실제 HTML 요소에 채워 넣는 함수
// item: API에서 가져온 동물 데이터 객체 하나
//==============================================
function renderAnimalDetail(item) {
  // imgEl이라는 변수에 html에 detail-img를 찾음
  // 대표이미지 및 하단 갤러리
  const imgEl = document.querySelector(".detail-img");
  const thumbList = document.querySelector(".thumb-list");
  // popfile1(대표사진), popfile2(추가사진) 중 값이 있는 것만 배열로 모음
  // filter: 배열 안을 훏으면서 조건에 맞는 것들만 남김
  // Boolean: 어떤 값이 true인지 false인지 판별해주는 기능
  // filter와 find의 차이: filter(여러개의 조건을 찾고 싶을때) find(단 한개의 조건)
  const images = [item.popfile1, item.popfile2].filter(Boolean);

  // 화면에 img태그가 존재하고 사진목록에 사진이 1개 이상이면 true
  // &&: and연산자(그리고) 좌우가 true여야지 true
  if (imgEl) {
    imgEl.onerror = () => imgError(imgEl); // 로드 실패 시 플레이스홀더
    imgEl.src = images.length > 0 ? images[0] : PLACEHOLDER_IMG;
  }
  if (thumbList) {
    // 썸네일 목록을 담을 HTML 상자가 화면에 존재하고
    if (images.length > 1) {
      // 사진이 2장 이상일 떄
      // HTML코드를 동적으로 실행해서
      thumbList.innerHTML = images
        // 사진들을 하나씩 꺼내서 HTML태그 조각 모양으로 1:1반환 해주는 반복문
        // src: 사진 주소 문자열
        // idx: 몇 번째 사진인지 알려줌 index
        .map(
          (src, idx) =>
            // 동적으로 li 배열을 만듬
            `
      <li>
      <img src="${src}" alt="썸네일 ${idx + 1}" class="thumb-img ${idx === 0 ? "active" : ""}" data-src="${src}" onerror="imgError(this)"/>
      </li>`,
        )
        // 배열들을 콤마 없이 하나의 html로 붙임
        .join("");
      // querySelectorAll로 찾아낸 상자에서 하나씩 차례대로 꺼내서 foreach문을 돌려
      // 각각의 썸네일마다 개별적으로 클릭센서를 달아줌
      // forEach: 상자속(tumblist)에 들어있는 데이터들을 처음부터 하나씩 꺼내어 똑같은 작업을
      //          반복 시켜줌
      // dataset: 태그에 숨겨둔 값의 주머니 동적 배열에 img 값에 data-src를 실행
      thumbList.querySelectorAll(".thumb-img").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          if (imgEl) imgEl.src = thumb.dataset.src;
          thumbList
            .querySelectorAll(".thumb-img")
            .forEach((t) => t.classList.remove("active"));
          thumb.classList.add("active");
        });
      });
    } else {
      thumbList.innerHTML = ""; // 사진 1장이면 썸네일 영역 비움
    }
  }

  // --- 품종 (null 방어코드) ---
  // if (speciesEl)을 먼저 써서 "이 글상자 태그가 화면에 안전하게 존재할 때만(true일 때만) 글자를 넣어라!
  const speciesEl = document.querySelector(".detail-species");
  // 품종에 넣을 HTML태그가 화면에 확실히 존재할 때만, API에서 가져온 품종 이름을 넣고
  // 없으면 "정보 없음"표시
  if (speciesEl) speciesEl.textContent = item.kindFullNm || "정보 없음";

  // --- 요약 텍스트 (성별,색상,나이,체중) ---
  const descTextEl = document.querySelector(".detail-desc-text");
  if (descTextEl) {
    const sex =
      // 삼항연산자로 item.sexCd(성별이 "F면" 암컷, false면 다음, 성별이 "M"이면 수컷, 둘다아니면 "미상")
      item.sexCd === "F" ? "암컷" : item.sexCd === "M" ? "수컷" : "미상";
    // 값이 없는 항목은 || ""로 빈 문자열 처리 "undefined" 방지
    descTextEl.textContent = `${sex} / ${item.colorCd || ""} / ${item.age || ""} / ${item.weight || ""}`;
  }

  // --- 상세 정보 목록(dl/dt/dd) 채우기 ---
  // 각 항목마다 "요소가 실제로 존재하는지" 먼저 확인(if)한 뒤 넣는다.
  // → HTML 구조가 바뀌어 해당 태그가 사라져도 에러 없이 안전하게 넘어감
  const numEl = document.querySelector(".detail-num");
  if (numEl) numEl.textContent = item.desertionNo || item.num || "-";

  const periodEl = document.querySelector(".detail-period");
  if (periodEl)
    periodEl.textContent = `${item.noticeSdt || ""} ~ ${item.noticeEdt || ""}`;

  const locEl = document.querySelector(".detail-loc");
  if (locEl) locEl.textContent = item.happenPlace || item.loc || "-";

  const noteEl = document.querySelector(".detail-note");
  if (noteEl) noteEl.textContent = item.specialMark || "특이사항 없음";

  const careEl = document.querySelector(".detail-care");
  if (careEl)
    careEl.textContent = `${item.careNm || ""} (tel: ${item.careTel || "-"})`;

  const orgEl = document.querySelector(".detail-org");
  if (orgEl) orgEl.textContent = item.orgNm || "-";

  const viewAppBtn = document.querySelector(".btn-view-app");
  if (viewAppBtn) {
    viewAppBtn.addEventListener("click", () => {
      showToast("앱에서 보기 기능은 준비 중입니다.");
    });
  }
  const btnAdoptApp = document.querySelector(".btn-adopt-app");
  if (btnAdoptApp) {
    btnAdoptApp.addEventListener("click", () => {
      showToast(
        `입양신청 기능 준비 중 · 문의: ${item.careTel || "보호센터로 직접 연락"}`,
      );
    });
  }
  setupComments(item.desertionNo || item.num);
}
// ==========================================
// 댓글 기능 — localStorage 저장/조회
// animalNum: 이 상세페이지가 보여주는 동물의 공고번호 (댓글을 구분하는 키)
// ==========================================

function setupComments(animalNum) {
  const commentInput = document.querySelector("#comment-input");
  const commentSubmitBtn = document.querySelector("#comment-submit-btn");
  const commentList = document.querySelector(".comment-list"); // ← comments-section 전체가 아니라 목록 부분만
  const commentCountEl = document.querySelector(".comment-count");

  if (!commentInput || !commentSubmitBtn || !commentList) return;

  function getAllComments() {
    try {
      return JSON.parse(localStorage.getItem("animalComments")) || {};
    } catch {
      return {};
    }
  }

  // 예시로 항상 노출하는 씨앗 댓글 (댓글이 어떻게 보이는지 보여주는 용도)
  const seedComment = {
    name: "fm_cookie♡",
    date: "2026-05-28 21:11:20",
    text: "안녕 아가 완전 곰돌이 같이 생겼구나!",
  };

  function renderComments() {
    const myComments = getAllComments()[animalNum] || [];

    if (commentCountEl) {
      commentCountEl.textContent = `${myComments.length + 1}개의 댓글`;
    }

    const rows = [
      seedComment,
      ...myComments.map((c) => ({ name: "방문자", date: c.date, text: c.text })),
    ];

    // 사용자 입력(text)이 들어가므로 innerHTML 대신 textContent 로 안전하게 그린다 (XSS 방지)
    commentList.innerHTML = "";
    rows.forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";

      const name = document.createElement("span");
      name.className = "user-name";
      name.textContent = c.name;

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = c.date;

      const text = document.createElement("p");
      text.textContent = c.text;

      item.append(name, date, text);
      commentList.appendChild(item);
    });
  }

  commentSubmitBtn.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (text === "") {
      showToast("댓글 내용을 입력해주세요.", "error");
      commentInput.focus();
      return;
    }

    const allComments = getAllComments();
    if (!allComments[animalNum]) {
      allComments[animalNum] = [];
    }

    allComments[animalNum].push({
      text,
      date: new Date().toLocaleString("ko-KR"),
    });

    localStorage.setItem("animalComments", JSON.stringify(allComments));
    commentInput.value = "";
    renderComments();
  });

  renderComments();
}
