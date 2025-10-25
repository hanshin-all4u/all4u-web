// js_vscode/edit_profile.js

// API 엔드포인트 (가상)
const API_BASE_URL = 'http://localhost:8080/api';
// 백엔드가 부분 수정을 지원한다고 가정하고 동일한 URL 사용
const EDIT_PROFILE_URL = `${API_BASE_URL}/members/update-profile`; // (예시) PATCH /api/members/update-profile

/**
 * JWT 토큰을 로컬 스토리지에서 가져오는 헬퍼 함수.
 * @returns {string | null} 저장된 토큰 값 또는 null
 */
function getToken() {
  return localStorage.getItem('accessToken');
}

/**
 * 닉네임 변경 폼 제출 핸들러
 */
async function handleNicknameSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const nickname = form.nickname.value.trim();
  const currentPassword = form.currentPassword.value;

  // 유효성 검사
  if (!nickname) {
    alert('새 닉네임을 입력하세요.');
    form.nickname.focus();
    return;
  }
  if (!currentPassword) {
    alert('본인 확인을 위해 현재 비밀번호를 입력해야 합니다.');
    form.currentPassword.focus();
    return;
  }

  // 보낼 데이터 (닉네임 + 인증)
  const updateData = {
    nickname: nickname,
    currentPassword: currentPassword
  };

  // 공통 API 호출 함수 사용
  await submitProfileUpdate(updateData, '닉네임이 성공적으로 변경되었습니다.', form);
}

/**
 * 비밀번호 변경 폼 제출 핸들러
 */
async function handlePasswordSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;
  const currentPassword = form.currentPassword.value;

  // 유효성 검사
  if (!newPassword || !confirmPassword) {
     alert('새 비밀번호와 확인용 비밀번호를 모두 입력하세요.');
     form.newPassword.focus();
     return;
  }
  if (newPassword.length < 8) {
     alert('새 비밀번호는 8자 이상으로 설정해야 합니다.');
     form.newPassword.focus();
     return;
  }
  if (newPassword !== confirmPassword) {
    alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    form.confirmPassword.focus();
    return;
  }
  if (!currentPassword) {
    alert('본인 확인을 위해 현재 비밀번호를 입력해야 합니다.');
    form.currentPassword.focus();
    return;
  }

  // 보낼 데이터 (새 비밀번호 + 인증)
  const updateData = {
    newPassword: newPassword,
    currentPassword: currentPassword
  };
  
  // 공통 API 호출 함수 사용
  await submitProfileUpdate(updateData, '비밀번호가 성공적으로 변경되었습니다.', form);
}


/**
 * [헬퍼] 공통 API 호출 함수
 * @param {object} bodyData - API로 보낼 JSON 바디
 * @param {string} successMessage - 성공 시 띄울 메시지
 * @param {HTMLFormElement} formElement - 오류 시 포커스를 줄 폼
 */
async function submitProfileUpdate(bodyData, successMessage, formElement) {
  const token = getToken();
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(EDIT_PROFILE_URL, {
      method: 'PATCH', // 부분 수정을 의미하는 PATCH 사용
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });

    if (response.ok) {
      alert(successMessage);
      formElement.reset(); // 성공 시 해당 폼만 초기화
      // window.location.href = 'mypage.html'; // 성공 후 마이페이지로 이동 (선택적)
      
    } else if (response.status === 401 || response.status === 400) {
      // 401: 인증 실패 (토큰 만료 등)
      // 400: 잘못된 요청 (예: 현재 비밀번호 불일치)
      const errorData = await response.json();
      alert(errorData.message || '현재 비밀번호가 일치하지 않거나, 잘못된 요청입니다.');
      
      // 해당 폼의 '현재 비밀번호' 필드에 포커스
      const currentPassInput = formElement.querySelector('input[name="currentPassword"]');
      if (currentPassInput) {
        currentPassInput.focus();
        currentPassInput.select();
      }
      
    } else {
      // 기타 서버 오류
      throw new Error(`API 오류: ${response.status}`);
    }

  } catch (error) {
    console.error('회원정보 수정 오류:', error);
    alert('회원정보 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}


// DOM이 로드되면 *두 개*의 폼에 각각 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
  const nicknameForm = document.getElementById('edit-nickname-form');
  const passwordForm = document.getElementById('edit-password-form');
  
  if (nicknameForm) {
    nicknameForm.addEventListener('submit', handleNicknameSubmit);
  }
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordSubmit);
  }
});

