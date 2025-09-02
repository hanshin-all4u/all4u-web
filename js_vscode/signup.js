const form = document.getElementById('signupForm');
const btn  = document.querySelector('.btn.cta');
const show = document.getElementById('showPwd');

function validate() {
  const data = new FormData(form);
  const last = (data.get('lastName') || '').trim();
  const first = (data.get('firstName') || '').trim();
  const email = (data.get('email') || '').trim();
  const pw1   = (data.get('password') || '').toString();
  const pw2   = (data.get('password2') || '').toString();

  const ok = last && first && email && /\S+@\S+\.\S+/.test(email) && pw1.length>=8 && pw1===pw2;
  btn.disabled = !ok;
  btn.classList.toggle('enabled', ok);
}

form.addEventListener('input', validate);

show.addEventListener('change', (e)=>{
  const type = e.target.checked ? 'text' : 'password';
  form.querySelector('input[name="password"]').type  = type;
  form.querySelector('input[name="password2"]').type = type;
});

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  if (btn.disabled) return;
  alert('회원가입이 정상적으로 처리되었습니다.');
  form.reset();
  validate();
});

validate();
