const form = document.getElementById('signupForm');
const btn  = document.querySelector('.btn.cta');
const show = document.getElementById('showPwd');
const nickInput = form.querySelector('input[name="nickname"]');
const checkBtn = form.querySelector('.btn-check');

const API_BASE_URL = 'http://localhost:8080'; // 백엔드 서버 주소

let nicknameAvailability = null; // null: 확인 안 함, true: 사용 가능, false: 사용 불가(중복)

function validate() {
  const data = new FormData(form);
  const last = (data.get('lastName') || '').trim();
  const first = (data.get('firstName') || '').trim();
  const nick = (data.get('nickname') || '').trim();
  const email = (data.get('email') || '').trim();
  const pw1   = (data.get('password') || '').toString();
  const pw2   = (data.get('password2') || '').toString();

  const ok = last && first && nick && nicknameAvailability === true && email && /\S+@\S+\.\S+/.test(email) && pw1.length>=8 && pw1===pw2;

  btn.disabled = !ok;
  btn.classList.toggle('enabled', ok);
}

form.addEventListener('input', validate);

show.addEventListener('change', (e)=>{
  const type = e.target.checked ? 'text' : 'password';
  form.querySelector('input[name="password"]').type  = type;
  form.querySelector('input[name="password2"]').type = type;
});

// 회원가입 폼 제출 이벤트 리스너
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btn.disabled) return;

  btn.disabled = true;
  btn.classList.remove('enabled');
  btn.textContent = '가입 처리 중...';

  const data = new FormData(form);
  const name = `${data.get('lastName')}${data.get('firstName')}`;
  const payload = {
    name: name,
    nickname: data.get('nickname'),
    email: data.get('email'),
    password: data.get('password'),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, { // API 엔드포인트 확인
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json(); // 응답 본문은 항상 읽도록 수정

    if (response.ok) { // 성공 시 (201 Created)
      alert(result.message);
      form.reset();
      nicknameAvailability = null; // 성공 시 상태 초기화
      validate();
    } else { // 실패 시 (4xx, 5xx 등)
      alert(result.message); // 서버 에러 메시지 표시

      // ▼▼▼ [수정] 409 Conflict 오류 처리 ▼▼▼
      if (response.status === 409) {
        // 메시지에 '닉네임'이 포함된 경우에만 닉네임 상태 초기화
        if (result.message && result.message.includes('닉네임')) {
          nicknameAvailability = null; // 닉네임 중복 시 상태 리셋
        }
        // 이메일 중복 오류인 경우 nicknameAvailability는 변경하지 않음
      }
      // 다른 종류의 오류(예: 400 Bad Request) 시에도 닉네임 상태는 유지할 수 있음
      // 필요하다면 여기서 다른 상태 코드에 대한 처리를 추가
    }
  } catch (error) {
    console.error('회원가입 fetch 오류:', error);
    alert('회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    // 네트워크 오류 시 닉네임 상태를 유지할지 초기화할지 결정 (유지하는 것이 나을 수 있음)
  } finally {
    btn.textContent = '회원가입';
    // finally 블록에서는 nicknameAvailability를 건드리지 않고, validate만 호출하여
    // try 또는 catch 블록에서 결정된 상태에 따라 버튼 활성화/비활성화
    validate();
  }
});


// 닉네임 중복확인 버튼 이벤트 (이전과 동일)
checkBtn.addEventListener('click', async () => {
  const nick = (nickInput.value || '').trim();
  if (!nick || nick.length < 2) {
    alert('닉네임은 2자 이상 입력해주세요.');
    nicknameAvailability = null;
    validate();
    return;
  }

  checkBtn.disabled = true;
  checkBtn.textContent = '확인 중...';
  nicknameAvailability = null;
  validate();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-nickname?nickname=${encodeURIComponent(nick)}`);
    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      nicknameAvailability = true;
    } else {
      alert(result.message);
      nicknameAvailability = false;
    }
  } catch (error) {
    console.error('닉네임 중복 확인 fetch 오류:', error);
    alert('닉네임 확인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    nicknameAvailability = null;
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = '중복확인';
    validate();
  }
});

// 닉네임 입력창 이벤트 (이전과 동일)
nickInput.addEventListener('input', () => {
  if (nicknameAvailability !== null) {
    nicknameAvailability = null;
    validate();
  }
});

validate(); // 초기화
