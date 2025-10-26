// js_vscode/search_all.js

const SEARCH_PAGE_URL = 'search'; // '.html' 확장자 없음

/**
 * 모든 검색 폼에 이벤트 리스너를 연결하여 search 페이지로 이동시키는 함수
 */
function initializeGlobalSearch() {
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

    const queryInput = e.currentTarget.querySelector('input[name="query"]');
    const query = queryInput ? queryInput.value.trim() : '';

    if (!query) {
        alert('검색어를 입력하세요.');
        return false;
    }

    const encodedQuery = encodeURIComponent(query);
    const targetPath = '/html_vscode/search'; // 실제 파일 경로에 맞게 조정

    // ▼▼▼ [수정] 현재 페이지가 search 페이지인 경우 처리 방식 변경 ▼▼▼
    const currentPath = window.location.pathname;
    if (currentPath.endsWith(targetPath) || currentPath.endsWith(targetPath + '/')) {
        // history.pushState 대신 페이지를 새로고침하여 search.js의 초기 로드 로직 실행
        window.location.href = `${targetPath}?query=${encodedQuery}`;
    } else {
        // 다른 페이지에서는 search 페이지로 이동
        window.location.href = `${targetPath}?query=${encodedQuery}`;
    }
    // ▲▲▲ [수정] 현재 페이지가 search 페이지인 경우 처리 방식 변경 ▲▲▲
}

// 페이지 로드 완료 시 검색 폼 초기화 함수 실행
document.addEventListener('DOMContentLoaded', initializeGlobalSearch);
