// ==========================================
// auth.js - 데모 회원 인증 (localStorage 기반, DB 없음)
// login.js / signup.js 공용 → 두 파일보다 먼저 로드
// ※ 데모용이라 비밀번호를 평문으로 저장합니다. 실서비스라면 서버에서 해시 처리해야 합니다.
// ==========================================

const USERS_KEY = "pawinhandUsers"; // localStorage 회원 목록 키

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 최초 진입 시 체험용 계정 하나 심어둠 (test / test1234)
function ensureDemoUser() {
  const users = getUsers();
  if (!users.some((u) => u.id === "test")) {
    users.push({ id: "test", pw: "test1234" });
    saveUsers(users);
  }
}
ensureDemoUser();

// --- 폼 검증 오류 표시 (login / signup 공용) ---
function showFieldError(input, message) {
  const p = document.createElement("p");
  p.className = "form-error";
  p.textContent = message;
  input.insertAdjacentElement("afterend", p);
  input.focus();
}

function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((el) => el.remove());
}
