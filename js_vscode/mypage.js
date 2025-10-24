// js_vscode/mypage.js

const API_BASE_URL = 'http://localhost:8080/api';
const MYPAGE_URL = `${API_BASE_URL}/favorites/licenses`; // GET /api/favorites/licenses

/**
 * JWT 토큰을 로컬 스토리지에서 가져오는 헬퍼 함수.
 * 'login.js'에서 저장한 키 ('accessToken')를 사용합니다.
 * @returns {string | null} 저장된 토큰 값 또는 null
 */
function getToken() {
    return localStorage.getItem('accessToken'); 
}

/**
 * 마이페이지의 관심 자격증 목록을 로드하고 HTML에 표시하는 함수
 */
async function loadFavoriteLicenses() {
    const token = getToken();
    // HTML에서 ID로 설정한 목록 컨테이너 요소
    const container = document.getElementById('favorite-licenses-list');
    
    // 로딩 메시지 표시
    if (container) {
        container.innerHTML = '<li>데이터 로드 중...</li>';
    }

    if (!token) {
        // 1. 토큰 없음: 로그인 필수
        if (container) {
            container.innerHTML = '<li>로그인 후 이용 가능한 기능입니다.</li>';
        }
        // alert('이 페이지에 접근하려면 로그인이 필요합니다.');
        // window.location.href = 'login.html'; // 실제 서비스에서는 리디렉션 처리
        return;
    }

    try {
        // 2. 인증된 API 요청 (GET /api/favorites/licenses)
        const response = await fetch(MYPAGE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // 토큰을 헤더에 포함
            }
        });

        // 3. 응답 처리
        if (response.ok) {
            const result = await response.json(); 
            // 백엔드가 페이징된 응답(예: { content: [...] })을 보낼 경우를 대비
            const favoriteLicenses = result.content || result; 
            
            renderFavoriteLicenses(favoriteLicenses, container);

        } else if (response.status === 401) {
            // 인증 만료
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        } else {
            // 기타 오류
            throw new Error(`API 오류 상태 코드: ${response.status}`);
        }

    } catch (error) {
        console.error('관심 자격증 로드 중 오류 발생:', error);
        if (container) {
            container.innerHTML = '<li>데이터 로드에 실패했습니다.</li>';
        }
    }
}

/**
 * 목록 데이터를 HTML로 변환하여 컨테이너에 삽입하는 함수
 */
function renderFavoriteLicenses(licenses, container) {
    if (!container) return;
    
    if (licenses.length === 0) {
        container.innerHTML = '<li>아직 관심 자격증이 없습니다.</li>';
        return;
    }

    // ⭐ 기존 HTML의 디자인(⭐ 대신 <li> 앞에 들어가는 아이콘)을 최대한 유지
    const listHtml = licenses.map(license => `
        <li>
            ⭐ 
            <a href="license_detail.html?jmcd=${license.jmcd || 'unknown'}">${license.jmfldnm || '자격증 이름 없음'}</a>
        </li>
    `).join('');

    container.innerHTML = listHtml;
}


// 페이지 로드 후 loadFavoriteLicenses 함수 실행
document.addEventListener('DOMContentLoaded', loadFavoriteLicenses);