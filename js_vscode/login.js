// login.js

// 아주 간단한 폼 유효성 & 데모 메시지
const form = document.getElementById("loginForm");
const msg = document.querySelector(".msg");

// Base URL 설정 (백엔드 주소)
const BASE_URL = 'http://localhost:8080'; 

form?.addEventListener("submit", async (e) => { // (*) async 추가 (비동기 처리)
  e.preventDefault();
  const data = new FormData(form);
  const email = (data.get("email") || "").toString().trim();
  const pw = (data.get("password") || "").toString();

  // 1. 유효성 검사
  if (!email || !pw) {
    msg.textContent = "이메일과 비밀번호를 입력해주세요.";
    msg.style.color = "#ef4444";
    return;
  }
  if (pw.length < 8) {
    msg.textContent = "비밀번호는 8자 이상이어야 합니다.";
    msg.style.color = "#ef4444";
    return;
  }
  
  // 2. 유효성 검사를 통과하면, 실제 API를 호출합니다.
  msg.textContent = "로그인 요청 전송 중...";
  msg.style.color = "#10b981";

  // (*) 실제 API 호출 함수 실행
  const success = await loginUser(email, pw); 
  
  // 3. 호출 결과에 따라 메시지 업데이트
  if (success) {
      msg.textContent = "로그인 성공! 홈으로 이동합니다.";
      msg.style.color = "#10b981";
      form.reset();
  } else {
      // loginUser 함수에서 이미 오류 메시지를 처리했으므로, 여기서는 추가 처리만 할 수도 있습니다.
      // 메시지 처리는 loginUser 함수 내부에 두는 것이 더 좋습니다.
      msg.textContent = "로그인 실패: 이메일 또는 비밀번호를 확인해주세요.";
      msg.style.color = "#ef4444";
  }
});


// -----------------------------------------------------------
// [새로 추가하거나 기존 코드를 수정하여 통합할 부분]
// -----------------------------------------------------------

async function loginUser(email, password) {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('accessToken', data.accessToken);
            window.location.href = 'Homepage.html'; // 성공 후 이동
            return true;
        } else {
            // 서버 응답은 받았으나 로그인 실패 (예: 401)
            msg.textContent = `로그인 실패: ${data.message || '이메일 또는 비밀번호 오류'}`;
            msg.style.color = "#ef4444";
            return false;
        }
    } catch (error) {
        // 서버 연결 오류 (네트워크 문제, 서버 꺼짐)
        msg.textContent = "서버 연결 오류가 발생했습니다. (백엔드 실행 상태 확인 필요)";
        msg.style.color = "#ef4444";
        console.error('Login Error:', error);
        return false;
    }
}
