// ==========================================
// login.js - 로그인 폼 유효성 검사 및 로그인 처리
// 역할: 아이디/비밀번호를 검증하고, 통과하면 localStorage에 아이디만 저장한 뒤
//       메인 페이지로 이동 시킨다. (실제 인증 서버는 없는 프론트엔드 전용 데모)
// ==========================================

// [1] DOM 요소 가져오기
// login.html에 있는 폼과 입력창들을 미리 찾아서 변수에 담아둔다.
const loginForm = document.querySelector("#login-form");
const idInput = document.querySelector("#id-input");
const pwInput = document.querySelector("#pw-input");

// localStorage에 저장할 때 쓸 키 이름을 상수로 빼둠
// 문자열을 여기저기 쓰면 오탈자 위험이 있으므로 상수화를 시킴 고정값!
const USERNAME_KEY = "username";

// [2] 폼 제출 이벤트(event)
// - form 태그의 submit 이벤트는 "로그인" 버튼을 눌러도, 입력창에서 엔터를 쳐도 똑같이 발생함
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    // 새로고침 방지
    e.preventDefault();
    // console.log("폼 제출 감지됨!");

    // 앞,뒤 공백만 입력하고 제출하는 걸 막기 위해 trim() 처리 trim: 공백 방지
    const userId = idInput.value.trim();
    const userPw = pwInput.value.trim();

    // 이전 제출에서 남은 검증 메시지 제거
    clearFormErrors();

    // [검증하기 1] 아이디 검사 (공백이면 입력창 아래에 오류 문구 표시 후 중단)
    if (userId === "") {
      showFieldError(idInput, "아이디를 입력해주세요.");
      return;
    }

    // [검증하기 2] 비밀번호 검사
    if (userPw === "") {
      showFieldError(pwInput, "비밀번호를 입력해주세요.");
      return;
    }

    // [검증하기 3] 비밀번호 8자리 이상 체크
    if (userPw.length < 8) {
      showFieldError(pwInput, "비밀번호는 8자리 이상이어야 합니다.");
      return;
    }

    // 3가지 검증을 거치면 아래 코드 실행

    // ==========================================
    // [3] 로그인 성공 처리
    // 실제 서버 인증 없이, 아이디만 브라우저에 저장해서 "로그인 된" 상태 유지(흄내?)
    // 초기엔 비밀번호 저장했지만 보안상 비밀번호는 저장 안함
    // ==========================================
    localStorage.setItem(USERNAME_KEY, userId);

    // 성공 토스트를 잠깐 보여준 뒤 메인 페이지로 이동
    showToast(`${userId}님, 로그인되었습니다.`);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  });
}

// 입력창 바로 아래에 오류 문구를 넣고 포커스를 옮긴다.
function showFieldError(input, message) {
  const p = document.createElement("p");
  p.className = "form-error";
  p.textContent = message;
  input.insertAdjacentElement("afterend", p);
  input.focus();
}

// 화면에 떠 있는 모든 오류 문구 제거
function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((el) => el.remove());
}
