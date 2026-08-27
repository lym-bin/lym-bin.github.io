// ==========================================
// login-state.js - 모든 페이지 공통: 로그인 상태를 헤더에 반영
// 역할: localStorage에 저장된 아이디가 있으면 "00님 환영합니다" 문구로 바꾸고
// 클릭시 로그아웃 처리를 한다.
// 주의: 전체 페이지에 공통 로드 되기 때문에 로그인 a링크에 id="nav-login" 필수!
//===========================================

// [1] localStorage에 저장된 아이디를 가져온다.
// 로그인 한적이 없다면 기본적으로 null값
const savedUsername = localStorage.getItem("username");
// [2] 헤더에 로그인 링크(a id="nav-login")을 찾음
const loginNav = document.querySelector("#nav-login");
// [3] if문으로 "저장된 아이디(saveUsername)가 있고", + "해당 페이지에 로그인 링크가 실제로 존재할 때만" 실행
// login.html은 기본적으로 헤더가 없는 페이지기 때문에 login-nav가 null이라 스킵
// !==는 불일치 연산자로 타입과(둘 다) 값이 같아야 true 정리하면 savedUsername이 null 아니어야하고
// login-nav가 존재(값이) 있어야 true
if (savedUsername !== null && loginNav) {
  // 로그인 버튼을 innerText로 내부를 사용자 아이디[로그아웃]으로 변경
  loginNav.innerText = `${savedUsername}님 환영합니다! [로그아웃]`;
  // 로그아웃 버튼으로 변경했기 때문에 링크 이동을 막아줌
  loginNav.href = "#"; // 링크 이동막기
  // [4] 로그아웃 클릭 이벤트
  loginNav.addEventListener("click", (e) => {
    // 새로고침 방지
    e.preventDefault();
    // 로컬스토리지에 저장 되었던 사용자 아이디 삭제
    localStorage.removeItem("username");

    // 로그아웃 토스트를 잠깐 보여준 뒤 리로드 (헤더가 다시 '로그인'으로 돌아감)
    showToast("로그아웃되었습니다.");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  });
}
