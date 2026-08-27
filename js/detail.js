// ================================================
// detail.js - 유기동물 상세 페이지
// 역할: URL의 쿼리스트링(?num=...)으로 넘어온 공고번호를 가지고
//      전체 목록 데이터를 조회한 뒤, 그 번호와 일치하는 동물 한 마리를 찾아 렌더링함.
// 참고: 초기 코드 작성할 때 전체 데이터(로딩,성능 트러블) 보단 단건 데이터로 가져오려고 했으나
//       공공데이터 API는 desertionNo(공고번호) 단건조회을 지원하지 않아서
//       (파라미터(값)를 줘도 목록에 제일 첫번째 공고 반환해줌)
//       전체 목록을 받아온 뒤 JS의 find()로 직접 찾는 방식을 쓴다.
//       새로고침/직접 URL 접근에도 항상 동일하게 작동하도록 이 방식을 씀
// ================================================

// 페이지 첫 진입(로드)시 브라우저가 html를 읽고 DOM 요소들을
// 완성하자마자 관찰?감시 하다가 코드를 실행 async(이 안에서 await 비동기 작업을 하겠다)
document.addEventListener("DOMContentLoaded", async () => {
  // [1] 주소창의 쿼리스트링에서 공고번호(num) 가져오기
  // 예: detail.html?num=공고번호 -> targetNum = "공고번호"
  const urlParams = new URLSearchParams(window.location.search);
  const targetNum = urlParams.get("num");

  // 공고번호 파라미터가 없다면 잘못된 접근이므로 if문으로 타켓이 없다면 실행X
  if (!targetNum) {
    showDetailError("잘못된 접근입니다. 공고번호가 없습니다.");
    return;
  }
  // [2] 전체 목록 조회(api.js의 fetchProtectData 사용)
  // numOfRows를 100도 줘보고 500도 줘봤지만 찾으려는 동물이 안나올 때가 있어서 넉넉하게 1000을줌
  const apiItems = await fetchProtectData({ numOfRows: 1000 });

  // 받아온 데이터(apiItems)가 아에 없거나, 들어있는 내용이 (0)개 면 alert 띄우고 이전 페이지로
  // ! (NOT 연산자): true를 false로 뒤 바꾸는 연산자
  // || (OR 연산자): 또는 왼쪽,오른쪽중 한가지라도 true면 true
  // === (값과 자료형이 완벽하게 같은지), ==(양쪽의 값이 같은지 자료형이 달라도 형변환해서 같다고 할 떄가 있어서 잘 안씀), =(값을 변수에 대입할 떄 사용)
  // length: 배열에선 갯수, 문자열이라면 길이
  if (!apiItems || apiItems.length === 0) {
    showDetailError("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // [3] 받아온 목록 중에서 URL의 공고번호와 일치하는 동물 하나를 찾는다.
  // String()으로 감싸는 이유: desertionNo가 숫자/문자 어느 타입으로 오든
  // 안전하게 문자열로 맞춰서 비교하기 위함 (타입 불일치로 인한 매칭 실패 방지)
  const currentAnimal = apiItems.find(
    // 담은상자(apiItems)에서 find(스마트한 함수)첫번째 요소부터 쭉 돌대 내가 원하는
    // 공고번호(desertionNo)와 내가 타켓한Num(공고번호)와 같다면 실행
    (item) => String(item.desertionNo) === String(targetNum),
  );

  // 타켓에 일치하지 않거나 데이터가 없다면 되돌리기
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

  function renderComments() {
    const allComments = getAllComments();
    const myComments = allComments[animalNum] || [];

    if (commentCountEl) {
      commentCountEl.textContent = `${myComments.length + 1}개의 댓글`;
    }

    const userCommentsHtml = myComments
      .map(
        (comment) => `
      <div class="comment-item">
        <span class="user-name">방문자</span>
        <span class="date">${comment.date}</span>
        <p>${comment.text}</p>
      </div>
    `,
      )
      .join("");

    // commentList(.comment-list)만 갈아끼우니 textarea/버튼은 그대로 남아있음
    const dummyComment = commentList.querySelector(".comment-item");
    commentList.innerHTML =
      (dummyComment ? dummyComment.outerHTML : "") + userCommentsHtml;
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
