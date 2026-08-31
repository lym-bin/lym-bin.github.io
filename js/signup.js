// ==========================================
// signup.js - 데모 회원가입 (localStorage)
// 검증 오류 표시 함수(showFieldError/clearFormErrors), getUsers/saveUsers 는 auth.js에 있음
// ==========================================

const signupForm = document.querySelector("#signup-form");
const sIdInput = document.querySelector("#signup-id");
const sPwInput = document.querySelector("#signup-pw");
const sPw2Input = document.querySelector("#signup-pw2");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors();

    const id = sIdInput.value.trim();
    const pw = sPwInput.value.trim();
    const pw2 = sPw2Input.value.trim();

    // [검증 1] 아이디 빈 값
    if (id === "") {
      showFieldError(sIdInput, "아이디를 입력해주세요.");
      return;
    }

    // [검증 2] 아이디 중복
    if (getUsers().some((u) => u.id === id)) {
      showFieldError(sIdInput, "이미 사용 중인 아이디입니다.");
      return;
    }

    // [검증 3] 비밀번호 8자 이상
    if (pw.length < 8) {
      showFieldError(sPwInput, "비밀번호는 8자리 이상이어야 합니다.");
      return;
    }

    // [검증 4] 비밀번호 확인 일치
    if (pw !== pw2) {
      showFieldError(sPw2Input, "비밀번호가 일치하지 않습니다.");
      return;
    }

    // [저장] 평문 저장 (데모)
    const users = getUsers();
    users.push({ id, pw });
    saveUsers(users);

    // 완료 → 로그인 페이지로
    showToast("가입이 완료되었습니다. 로그인해 주세요.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  });
}
