// 아주 간단한 폼 유효성 & 데모 메시지
const form = document.getElementById("loginForm");
const msg = document.querySelector(".msg");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const email = (data.get("email") || "").toString().trim();
  const pw = (data.get("password") || "").toString();

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
  msg.textContent = "로그인 요청이 전송되었습니다. (데모)";
  msg.style.color = "#10b981";
  form.reset();
});
