// js_vscode/search.js

const API_BASE_URL = 'http://localhost:8080/api';
const SEARCH_ENDPOINT = `${API_BASE_URL}/search`; // 백엔드 통합 검색 API 엔드포인트

// DOM 요소 변수 선언 (코드 상단으로 이동)
let searchForm;
let searchInput;
let searchKeywordSpan;
let resultsContainer;

/**
 * URL의 쿼리 스트링에서 'query' 키워드를 가져옵니다.
 */
function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('query'); // search_all.js가 설정한 'query' 파라미터
}

/**
 * 검색 결과를 화면에 동적으로 렌더링합니다.
 * @param {Array<Object>} results - 검색 API 응답 데이터 (List<IntegratedSearchResultDto>)
 * @param {string} query - 검색 키워드
 */
function renderSearchResults(results, query) {
    if (!resultsContainer) return; // resultsContainer가 없으면 중단

    // 1. 결과 헤더 업데이트
    if (searchKeywordSpan) {
        searchKeywordSpan.textContent = `"${query}"`; // 따옴표 추가
    }

    resultsContainer.innerHTML = ''; // 이전 결과 초기화

    // ▼▼▼ [수정] API 응답(배열)을 타입별로 필터링 ▼▼▼
    const licenseResults = results.filter(item => item.type === 'LICENSE');
    const reviewResults = results.filter(item => item.type === 'REVIEW');
    const noticeResults = results.filter(item => item.type === 'NOTICE');

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card empty-result">
                <h2>검색 결과 없음 (0건)</h2>
                <p>입력한 검색어 '${query}'에 대한 정보가 없습니다.</p>
            </div>
        `;
        return;
    }

    let htmlContent = '';

    // --- 2. 자격증 결과 렌더링 (LICENSE) ---
    htmlContent += `
        <div class="result-group">
            <h3>✅ 자격증 (${licenseResults.length}건)</h3>
            <div class="card-list">
    `;
    if (licenseResults.length > 0) {
        licenseResults.forEach(item => {
            // item.id: jmcd, item.title: 자격증 이름, item.content: seriesnm
            htmlContent += `
                <article class="card license-card" data-jmcd="${item.id}"> <h2>${item.title}</h2>
                    <p class="content-type">${item.content}</p>
                    <button class="btn link primary cert-detail-btn">자격증 상세 보기</button>
                </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 자격증 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';

    // --- 3. 후기 결과 렌더링 (REVIEW) ---
    htmlContent += `
        <div class="result-group">
            <h3>📝 시험 후기 (${reviewResults.length}건)</h3>
            <div class="card-list">
    `;
    if (reviewResults.length > 0) {
        reviewResults.forEach(item => {
             // item.id: reviewId, item.title: 후기 제목(Re: ...), item.content: 후기 내용 미리보기
             htmlContent += `
                <article class="card review-card" data-review-id="${item.id}"> <h2>${item.title}</h2>
                    <p class="content-preview">${item.content}</p> <button class="btn link secondary review-detail-btn">후기 전문 보기</button> </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 후기 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';

    // --- 4. 공지사항 결과 렌더링 (NOTICE) ---
    htmlContent += `
        <div class="result-group">
            <h3>📢 공지사항 (${noticeResults.length}건)</h3>
            <div class="card-list">
    `;
    if (noticeResults.length > 0) {
        noticeResults.forEach(item => {
             // item.id: noticeId, item.title: 공지 제목, item.content: 공지 내용 미리보기
             htmlContent += `
                <article class="card notice-card" data-notice-id="${item.id}"> <h2>${item.title}</h2>
                    <p class="content-preview">${item.content}</p> <button class="btn link secondary notice-detail-btn">공지 전문 보기</button> </article>
            `;
        });
    } else {
         htmlContent += '<p class="no-results-sub">해당 공지사항 검색 결과가 없습니다.</p>';
    }
    htmlContent += '</div></div>';
    // ▲▲▲ [수정] 렌더링 로직 완료 ▲▲▲

    resultsContainer.innerHTML = htmlContent;

    // 5. 동적으로 생성된 상세 보기 버튼들에 이벤트 리스너 연결
    attachResultDetailListeners();
}

/**
 * API 호출 및 검색 시작
 */
async function performSearch(query) {
    // 검색어가 없으면 헤더만 초기화하고 중단
    if (!query) {
        if (searchKeywordSpan) searchKeywordSpan.textContent = '...';
        if (resultsContainer) resultsContainer.innerHTML = '<div class="card"><p>검색어를 입력하고 검색 버튼을 누르세요.</p></div>';
        return;
    }

    // 로딩 표시
    if (searchKeywordSpan) searchKeywordSpan.textContent = `"${query}"`;
    if (resultsContainer) resultsContainer.innerHTML = '<div class="card"><p>🔍 검색 중입니다...</p></div>';

    try {
        // ▼▼▼ [수정] API 호출 시 파라미터 이름을 'query='로 변경 ▼▼▼
        const response = await fetch(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // API 응답은 List<IntegratedSearchResultDto> 배열
        renderSearchResults(data, query); // 배열 데이터를 렌더링 함수로 전달

    } catch (error) {
        console.error("검색 중 오류 발생:", error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="card error-card">
                    <h2>검색 오류</h2>
                    <p>검색 결과를 불러오는 데 실패했습니다. 서버 상태(${API_BASE_URL}) 또는 CORS 설정을 확인하세요.</p>
                </div>`;
        }
    }
}

/**
 * 동적으로 생성된 상세 보기 버튼들에 이벤트 리스너를 연결합니다.
 */
function attachResultDetailListeners() {
    // 자격증 상세 보기 버튼
    document.querySelectorAll('.cert-detail-btn').forEach(button => {
        // 중복 추가 방지 (선택 사항)
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', (event) => {
            // 가장 가까운 부모 article 요소에서 data-jmcd 값을 찾음
            const item = event.currentTarget.closest('.license-card');
            const jmcd = item ? item.dataset.jmcd : null;

            if (jmcd) {
                // certificate_detail 페이지로 이동 (확장자 제거된 경로 사용)
                window.location.href = `certificate_detail?jmcd=${jmcd}`;
            } else {
                console.error('자격증 ID(jmcd)를 찾을 수 없습니다.', item);
                alert('자격증 상세 정보를 여는 데 실패했습니다.');
            }
        });
    });

    // 후기 전문 보기 버튼 (경로는 실제 파일명에 맞게 수정 필요)
    document.querySelectorAll('.review-detail-btn').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', (event) => {
            const item = event.currentTarget.closest('.review-card');
            const reviewId = item ? item.dataset.reviewId : null;
            if (reviewId) {
                window.location.href = `review_full?reviewId=${reviewId}`; // 예시 경로
            } else {
                 console.error('후기 ID(reviewId)를 찾을 수 없습니다.', item);
                 alert('후기 상세 정보를 여는 데 실패했습니다.');
            }
        });
    });

    // 공지 전문 보기 버튼 (경로는 실제 파일명에 맞게 수정 필요)
    document.querySelectorAll('.notice-detail-btn').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = 'true';

        button.addEventListener('click', (event) => {
            const item = event.currentTarget.closest('.notice-card');
            const noticeId = item ? item.dataset.noticeId : null;
            if (noticeId) {
                window.location.href = `notice_full?noticeId=${noticeId}`; // 예시 경로
            } else {
                 console.error('공지 ID(noticeId)를 찾을 수 없습니다.', item);
                 alert('공지 상세 정보를 여는 데 실패했습니다.');
            }
        });
    });
}

// === 페이지 로드 시 실행 로직 ===
document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 초기화
    searchForm = document.getElementById("searchForm");
    searchInput = document.getElementById("searchInput");
    searchKeywordSpan = document.getElementById("searchKeyword");
    resultsContainer = document.getElementById("resultsContainer");

    // search.html 페이지 내 검색 폼 제출 이벤트 처리
    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const query = searchInput ? searchInput.value.trim() : '';
            if (!query) {
                alert("검색어를 입력하세요.");
                return;
            }
            // 검색 수행 함수 호출
            performSearch(query);
            // URL 업데이트 (선택 사항 - history.pushState 사용 시)
            // const targetPath = '/html_vscode/search'; // 실제 경로 확인 필요
            // window.history.pushState({ query: query }, '', `${targetPath}?query=${encodeURIComponent(query)}`);
        });
    }

    // 페이지 첫 로드 시 URL 파라미터에서 검색어 가져와 검색 수행
    const initialQuery = getSearchQuery();
    // 검색창에도 초기 검색어 설정
    if (searchInput && initialQuery) {
        searchInput.value = initialQuery;
    }
    performSearch(initialQuery); // initialQuery가 null이어도 함수 내에서 처리됨

    // ▼▼▼ [수정] 전역 함수 노출 제거 ▼▼▼
    // window.performSearch = performSearch;
});
