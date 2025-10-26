// certificate_detail.js

// ▼▼▼ [확인 로그 1] 스크립트 파일 로드 및 실행 시작 확인 ▼▼▼
console.log('[DEBUG] certificate_detail.js script started.');
// ▼▼▼ [확인 로그 2] 현재 페이지의 URL 전체 확인 ▼▼▼
console.log('[DEBUG] Current window.location.href:', window.location.href);
// ▼▼▼ [확인 로그 3] 현재 페이지의 URL 쿼리 스트링 확인 ▼▼▼
console.log('[DEBUG] Current window.location.search:', window.location.search);


// API 엔드포인트: GET http://localhost:8080/api/licenses/{jmcd}
const API_BASE_URL = 'http://localhost:8080/api/licenses';

/**
 * 1. URL 쿼리 파라미터 가져오기
 */
function getUrlParameter(key) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(key);
    // ▼▼▼ [확인 로그 4] getUrlParameter 함수 결과 확인 ▼▼▼
    console.log(`[DEBUG] getUrlParameter('${key}') returned:`, value);
    return value;
}

/**
 * 2. API 호출하여 상세 정보 가져오기
 */
async function fetchCertificateDetail(jmcd) {
    // ▼▼▼ [확인 로그 5] fetchCertificateDetail 함수 시작 및 전달받은 jmcd 값 확인 ▼▼▼
    console.log('[DEBUG] fetchCertificateDetail called with jmcd:', jmcd);

    if (!jmcd) {
        console.error('[DEBUG] jmcd is missing or null. Stopping API call.'); // 오류 로그 강화
        document.getElementById('certName').textContent = '❌ 오류: ID 누락';
        document.getElementById('certSummary').textContent = '자격증 ID가 URL 파라미터에 없습니다.';
        return;
    }

    const endpoint = `${API_BASE_URL}/${jmcd}`;
    console.log('[DEBUG] Fetching API endpoint:', endpoint); // API 호출 주소 확인

    try {
        const response = await fetch(endpoint);
        console.log('[DEBUG] API response status:', response.status); // 응답 상태 확인

        if (!response.ok) {
            const errorText = response.status === 404 ? '존재하지 않는 자격증 ID입니다.' : `HTTP 오류: ${response.status}`;
            console.error('[DEBUG] API call failed:', errorText); // API 오류 로그
            document.getElementById('certName').textContent = '데이터 로드 실패';
            document.getElementById('certSummary').textContent = errorText;
            throw new Error(errorText);
        }

        const data = await response.json();
        console.log('[DEBUG] API data received:', data); // 받은 데이터 확인
        updateDetailPage(data);

    } catch (error) {
        // console.error('[DEBUG] Failed to fetch certificate details:', error); // try 블록 밖의 에러 로깅은 중복될 수 있어 주석 처리
        // 오류 시 기본 텍스트 표시
        if (!document.getElementById('certName').textContent.includes('실패')) {
             document.getElementById('certName').textContent = '통신 실패';
             document.getElementById('certSummary').textContent = '서버와의 연결에 실패했습니다. (콘솔 확인)';
        }
        // 나머지 필드도 기본값 처리
        // ... (기존 코드 유지) ...
    }
}

/**
 * 3. API 데이터를 HTML 요소에 업데이트
 */
function updateDetailPage(data) {
    console.log('[DEBUG] Updating page with data...'); // 업데이트 시작 로그
    document.getElementById('certName').textContent = data.jmfldnm || '정보 없음';
    document.getElementById('certSeries').textContent = data.seriesnm || '정보 없음';
    document.getElementById('certSummary').textContent = data.summary || '자격증 개요 정보가 없습니다.';
    document.getElementById('certJob').textContent = data.job || '수행 직무 정보가 없습니다.';
    document.getElementById('certCareer').textContent = data.career || '진로 및 전망 정보가 없습니다.';
    document.getElementById('certTrend').textContent = data.trend || '출제 경향 정보가 없습니다.';
    document.getElementById('certQualgbnm').textContent = data.qualgbnm || '시험 구분 정보가 없습니다.';

    // 시험 과목 목록
    if (data.subjects && data.subjects.length > 0) {
        const subjectsText = data.subjects.map(subject => subject.kmNm).join(', ');
        document.getElementById('certSubjects').textContent = subjectsText;
    } else {
        document.getElementById('certSubjects').textContent = '시험 과목 정보가 없습니다.';
    }

    // 실기 지참물 목록
    if (data.practicalItems && data.practicalItems.length > 0) {
        const itemsText = data.practicalItems.map(item => `${item.mtrlNm}${item.mtrlExpl ? ` (${item.mtrlExpl})` : ''}`).join(' / ');
        document.getElementById('certPracticalItems').textContent = itemsText;
    } else {
        document.getElementById('certPracticalItems').textContent = '실기 지참물 정보가 없습니다.';
    }
    console.log('[DEBUG] Page update complete.'); // 업데이트 완료 로그
}

/**
 * 4. 페이지 로드 완료 시 실행
 */
document.addEventListener('DOMContentLoaded', () => {
    // ▼▼▼ [확인 로그 6] DOMContentLoaded 이벤트 발생 확인 ▼▼▼
    console.log('[DEBUG] DOMContentLoaded event fired.');

    const jmcd = getUrlParameter('jmcd');
    fetchCertificateDetail(jmcd);

    // 뒤로 가기 버튼 (querySelector가 null일 수 있으므로 확인)
    const backButton = document.querySelector('.back-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    } else {
        console.warn('[DEBUG] Back button (.back-btn) not found.');
    }

    // 최상단 이동 버튼 (querySelector가 null일 수 있으므로 확인)
    const topButton = document.querySelector('.top-btn');
    if (topButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                topButton.style.display = 'block';
            } else {
                topButton.style.display = 'none';
            }
        });
        topButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        console.warn('[DEBUG] Top button (.top-btn) not found.');
    }
});