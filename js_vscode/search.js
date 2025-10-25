// js_vscode/search.js

const API_BASE_URL = 'http://localhost:8080/api';
const SEARCH_ENDPOINT = `${API_BASE_URL}/search`; 

// DOM 요소 변수 선언
let searchForm;
let searchInput;
let searchKeywordSpan;
let resultsContainer;

/**
 * 통합 검색 API를 호출하고 결과를 반환합니다.
 * @param {string} query 검색할 키워드
 */
async function fetchAndRenderResults(query) {
    // API 명세: GET /api/search?query={검색어}&page=0&size=10 (페이징 파라미터는 기본값으로 자동 추가됨)
    const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`;
    
    try {
        // 1. 로딩 표시
        resultsContainer.innerHTML = '<div class="card"><p>🔍 검색 중입니다...</p></div>'; 
        
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`API 호출 실패: ${errorData.message}`);
        }
        
        const results = await response.json(); // List<IntegratedSearchResultDto>
        
        // 2. 결과 렌더링
        renderResults(results, query);
        
    } catch (e) {
        console.error('검색 중 오류 발생:', e);
        resultsContainer.innerHTML = `
            <div class="card error-card">
                <h2>검색 오류</h2>
                <p>데이터 로드에 실패했습니다. 서버 상태(Docker)를 확인하세요.</p>
            </div>
        `;
    }
}

/**
 * 검색 결과를 HTML에 동적으로 렌더링합니다. (API 응답 구조에 맞춤)
 */
function renderResults(results, query) {
    searchKeywordSpan.textContent = `"${query}"`;
    resultsContainer.innerHTML = "";

    // 1. 타입별로 결과 필터링
    const licenseResults = results.filter(item => item.type === 'LICENSE');
    const reviewResults = results.filter(item => item.type === 'REVIEW');
    // ▼▼▼ [추가] 공지사항(NOTICE) 결과 필터링 ▼▼▼
    const noticeResults = results.filter(item => item.type === 'NOTICE');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card empty-result">
                <h2>검색 결과 없음 (0건)</h2>
                <p>입력한 검색어에 대한 자격증, 후기 또는 공지사항 정보가 없습니다.</p>
            </div>
        `;
        return;
    }

    let htmlContent = '';
    
    // --- 1. 자격증 결과 렌더링 (LICENSE) ---
    htmlContent += `
        <div class="result-group">
            <h3>✅ 자격증 (${licenseResults.length}건)</h3>
            <div class="card-list">
    `;
    if (licenseResults.length > 0) {
        licenseResults.forEach(item => {
            // item.id: jmcd, item.title: 자격증 이름, item.content: seriesnm
            htmlContent += `
                <article class="card license-card">
                    <h2>${item.title}</h2>
                    <p class="content-type">${item.content}</p>
                    <a href="license_detail.html?jmcd=${item.id}" class="btn link primary">자격증 상세 보기</a>
                </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 자격증 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';
    
    // --- 2. 후기 결과 렌더링 (REVIEW) ---
    htmlContent += `
        <div class="result-group">
            <h3>📝 시험 후기 (${reviewResults.length}건)</h3>
            <div class="card-list">
    `;
    if (reviewResults.length > 0) {
        reviewResults.forEach(item => {
             // item.id: reviewId, item.title: 후기 제목, item.content: 후기 내용
             htmlContent += `
                <article class="card review-card">
                    <h2>${item.title}</h2>
                    <p class="content-preview">${item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}</p>
                    <a href="review_detail.html?reviewId=${item.id}" class="btn link secondary">후기 전문 보기</a>
                </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 후기 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';

    // ▼▼▼ [추가] 3. 공지사항 결과 렌더링 (NOTICE) ▼▼▼
    htmlContent += `
        <div class="result-group">
            <h3>📢 공지사항 (${noticeResults.length}건)</h3>
            <div class="card-list">
    `;
    if (noticeResults.length > 0) {
        noticeResults.forEach(item => {
             // item.id: noticeId, item.title: 공지 제목, item.content: 공지 내용
             htmlContent += `
                <article class="card notice-card">
                    <h2>${item.title}</h2>
                    <p class="content-preview">${item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}</p>
                    <a href="notice_detail.html?noticeId=${item.id}" class="btn link secondary">공지 전문 보기</a>
                </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 공지사항 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';
    // ▲▲▲ [추가] 공지사항 렌더링 끝 ▲▲▲

    resultsContainer.innerHTML = htmlContent;
}


// -----------------------------------------------------------------
// DOMContentLoaded 및 초기 실행 로직 (수정 없음)
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 초기화
    searchForm = document.getElementById("searchForm");
    searchInput = document.getElementById("searchInput");
    searchKeywordSpan = document.getElementById("searchKeyword");
    resultsContainer = document.getElementById("resultsContainer");

    // 현재 페이지에서의 검색 폼 제출 이벤트 처리
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) {
            resultsContainer.innerHTML = "<p class='no-results'>검색어를 입력하세요.</p>";
            return;
        }

        await fetchAndRenderResults(query);
    });

    // 페이지 첫 진입 시 초기 검색 실행 (URL 파라미터 확인)
    async function initialSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        let initialQuery = urlParams.get('query'); 
        
        // URL에 쿼리가 없으면 input의 현재 값을 가져옴 (비어있을 가능성 높음)
        if (!initialQuery) {
             initialQuery = searchInput.value.trim();
        }

        searchInput.value = initialQuery;
        
        if (initialQuery) {
            await fetchAndRenderResults(initialQuery);
        } else {
            // 검색어 없이 진입 시 초기 화면 (검색 대기) 표시
            resultsContainer.innerHTML = '<div class="card"><p>검색어를 입력하고 통합 검색을 시작하세요.</p></div>';
            searchKeywordSpan.textContent = '통합 검색';
        }
    }
    
    initialSearch();
});
