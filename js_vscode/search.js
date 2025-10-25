// js_vscode/search_all.js

const SEARCH_PAGE_URL = 'search.html'; 

/**
 * 모든 검색 폼에 이벤트 리스너를 연결하여 search.html로 리다이렉트시키는 함수
 */
function initializeGlobalSearch() {
    // 모든 검색 폼 (class="search" 사용)을 찾습니다.
    const searchForms = document.querySelectorAll('.search');
    
    searchForms.forEach(searchForm => {
        searchForm.addEventListener('submit', handleGlobalSearchSubmit);
    });
}

/**
 * 검색 폼 제출 이벤트를 처리하고 검색 페이지로 이동시키는 함수
 */
function handleGlobalSearchSubmit(e) {
    e.preventDefault();
    
    // input[name="query"]의 값을 가져옵니다.
    const queryInput = e.currentTarget.querySelector('input[name="query"]');
    const query = queryInput ? queryInput.value.trim() : '';
    
    if (!query) {
        alert('검색어를 입력하세요.');
        return false;
    }

    const encodedQuery = encodeURIComponent(query);
    
    // 현재 페이지가 search.html인 경우 (페이지 전환 없이 URL만 변경)
    if (window.location.pathname.includes(SEARCH_PAGE_URL)) {
        window.history.pushState({}, '', `${SEARCH_PAGE_URL}?query=${encodedQuery}`);
        
        // URL 변경 후 search.js의 초기 검색 로직을 수동으로 다시 실행 (DOM 컨텐츠가 바뀌었음을 알림)
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
    } else {
        // 다른 페이지에서는 search.html로 이동
        window.location.href = `${SEARCH_PAGE_URL}?query=${encodedQuery}`;
    }
}

document.addEventListener('DOMContentLoaded', initializeGlobalSearch);
