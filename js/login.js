// ==========================================
// login.js - 데모 로그인 (auth.js의 localStorage 회원 목록으로 검증)
// 검증 오류 표시 함수(showFieldError / clearFormErrors), getUsers 는 auth.js에 있음
// auth.js → login.js 순서로 로드해야 함
// ==========================================

const loginForm = document.querySelector("#login-form");
const idInput = document.querySelector("#id-input");
const pwInput = document.querySelector("#pw-input");
const USERNAME_KEY = "username"; // 로그인 상태 유지용 (아이디만 저장)

// 로그인 성공 처리 (일반 로그인 + 체험 계정 공용)
function loginSuccess(userId) {
  localStorage.setItem(USERNAME_KEY, userId);
  showToast(`${userId}님, 로그인되었습니다.`);
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors();

    const userId = idInput.value.trim();
    const userPw = pwInput.value.trim();

    // [검증 1] 아이디 빈 값
    if (userId === "") {
      showFieldError(idInput, "아이디를 입력해주세요.");
      return;
    }

    // [검증 2] 비밀번호 빈 값
    if (userPw === "") {
      showFieldError(pwInput, "비밀번호를 입력해주세요.");
      return;
    }

    // [검증 3] 회원 목록에서 아이디/비밀번호 대조
    const user = getUsers().find((u) => u.id === userId); // auth.js에서 localStorage에서 회원 배열 꺼냄 id로찾기
    if (!user || user.pw !== userPw) {
      // 아이디 없거나 or 비밀번호 틀리면
      showFieldError(pwInput, "아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // [성공]
    loginSuccess(userId);
  });

  // 체험 계정 버튼: 폼(비밀번호 입력창)을 거치지 않고 바로 로그인 처리
  // → 브라우저 "유출된 비밀번호" 경고 팝업 방지
  const demoLoginBtn = document.querySelector("#demo-login-btn");
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", () => loginSuccess("test"));
  }
}
