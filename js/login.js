// ==========================================
// login.js - 데모 로그인 (auth.js의 localStorage 회원 목록으로 검증)
// 검증 오류 표시 함수(showFieldError / clearFormErrors), getUsers 는 auth.js에 있음
// auth.js → login.js 순서로 로드해야 함
// ==========================================

const loginForm = document.querySelector("#login-form");
const idInput = document.querySelector("#id-input");
const pwInput = document.querySelector("#pw-input");
const USERNAME_KEY = "username"; // 로그인 상태 유지용 (아이디만 저장)

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
    const user = getUsers().find((u) => u.id === userId);
    if (!user || user.pw !== userPw) {
      showFieldError(pwInput, "아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // [성공] 아이디를 저장해 로그인 상태 유지 → 메인으로
    localStorage.setItem(USERNAME_KEY, userId);
    showToast(`${userId}님, 로그인되었습니다.`);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  });

  // 체험 계정 버튼: test / test1234 자동 입력 후 제출 (위 submit 로직 그대로 탐)
  const demoLoginBtn = document.querySelector("#demo-login-btn");
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", () => {
      idInput.value = "test";
      pwInput.value = "test1234";
      loginForm.requestSubmit();
    });
  }
}
