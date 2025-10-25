// js_vscode/license.js

const API_BASE_URL = 'http://localhost:8080/api';
const LICENSES_ENDPOINT = `${API_BASE_URL}/licenses`; // GET /api/licenses (2.1 Endpoint)

/**
 * HTML에 남아있는 검색 처리 함수 (현재는 전역 검색으로 대체됨)
 * 전역 검색은 search_all.js에서 처리되므로, 이 함수는 사용되지 않거나 필요시 삭제 가능합니다.
 */
function handleSearch(e){
    e.preventDefault();
    const q = e.currentTarget.q.value.trim();
    if(!q){ alert('검색어를 입력하세요.'); return false; }
    return false;
}

/**
 * 자격증 목록 API를 호출하여 데이터를 가져와 HTML 패널에 표시하는 함수
 * (기존 코드에서 API 응답 구조를 Page<License>에 맞춰 수정했습니다.)
 */
async function loadLicenseDataToPanels() {
    // 쿼리 파라미터 예시: 페이징을 위한 설정
    const queryParams = new URLSearchParams({
        page: 0,
        size: 10,
        sort: 'jmfldnm,asc'
        // keyword: '정보'  <-- 필요시 검색 키워드 추가 가능
    });
    
    const endpoint = `${LICENSES_ENDPOINT}?${queryParams.toString()}`;
    const panels = document.querySelectorAll('.main-grid .panel');
    const numPanels = panels.length;
    
    if (numPanels === 0) {
        console.warn("표시할 '.panel' 요소가 HTML에 없습니다. 패널 요소를 확인해주세요.");
        return;
    }

    try {
        // 1. 자격증 목록 API 호출 (인증 불필요)
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
        }
        
        // 2. 응답이 Page<License> JSON 구조임을 가정하고 처리
        const pageData = await response.json(); 
        const licenses = pageData.content; // 'content' 필드에서 실제 자격증 배열 추출
        
        if (!licenses || licenses.length === 0) {
            console.log("백엔드에서 자격증 정보가 없습니다. 목록을 채우지 않습니다.");
            return;
        }

        // 3. HTML 패널에 데이터 바인딩
        for (let i = 0; i < numPanels; i++) {
            const licenseIndex = i % licenses.length;
            const license = licenses[licenseIndex];
            
            const panel = panels[i];
            
            // h3에 자격증명 바인딩
            const titleElement = panel.querySelector('h3');
            if (titleElement) {
                titleElement.textContent = license.jmfldnm; // 자격증명
            }
            
            // ul.list에 계열/구분 정보 바인딩
            let listElement = panel.querySelector('.list');
            if (listElement) {
                 listElement.innerHTML = `
                    <li>계열: ${license.seriesnm}</li>
                    <li>구분: ${license.qualgbnm}</li>
                    <li>고유ID: ${license.jmcd}</li>
                    <li><a href="license_detail.html?jmcd=${license.jmcd}">상세 보기</a></li>
                `;
            } else {
                // ul.list가 없을 경우 대비 (원래 코드의 fallback 로직 유지)
                panel.innerHTML = `<h3>${license.jmfldnm}</h3><p>${license.seriesnm} (${license.qualgbnm})</p>`;
            }
        }

        console.log(`총 ${numPanels}개 패널에 ${licenses.length}개 자격증 정보를 바인딩했습니다.`);
        
    } catch (error) {
        console.error("API 데이터 로드 중 오류 발생:", error.message);
    }
}

// 페이지 로드 후 함수 실행
document.addEventListener('DOMContentLoaded', loadLicenseDataToPanels);