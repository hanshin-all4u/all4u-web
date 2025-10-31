// js_vscode/review.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. (가정) URL에서 자격증 ID (jmcd)를 가져옵니다.
    const urlParams = new URLSearchParams(window.location.search);
    const jmcd = urlParams.get('jmcd'); // 예: '0950'

    if (!jmcd) {
        // (임시) jmcd가 없으면 '0950' (정보처리기사)로 강제 설정 (테스트용)
        console.warn('jmcd 쿼리 파라미터가 없어 테스트용 "0950"을 사용합니다.');
        // window.location.href = '자격증_목록_페이지.html'; // 실제로는 목록으로 돌려보내야 함
        loadReviews('0950'); 
    } else {
        // 2. 해당 자격증의 후기 목록을 불러옵니다.
        loadReviews(jmcd);
    }

    // (참고) search_all.js는 이미 연결되어 있으므로 검색창 로직은 작동합니다.
});

/**
 * (가정) API로 후기 목록을 불러와 렌더링하는 함수
 */
async function loadReviews(jmcd) {
    const gridContainer = document.querySelector('.reviews-grid');
    if (!gridContainer) return;

    // 1. 로딩 표시 (선택 사항)
    gridContainer.innerHTML = '<p style="text-align: center;">후기 목록을 불러오는 중...</p>';

    try {
        // 2. (가정) 특정 자격증의 후기 목록 API 호출
        // 📌 (API 명세서에 없던 GET 엔드포인트를 가정)
        const response = await fetch(`http://localhost:8080/api/licenses/${jmcd}/reviews`, {
            method: 'GET',
            // (필요시 인증 헤더 추가)
            // headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        if (!response.ok) {
            throw new Error(`[${response.status}] 후기 목록을 불러오는데 실패했습니다.`);
        }

        const reviewList = await response.json();

        // 3. (중요) 기존 내용 비우기
        gridContainer.innerHTML = ''; 

        if (!reviewList || reviewList.length === 0) {
            gridContainer.innerHTML = '<p style="text-align: center; color: #888;">작성된 후기가 없습니다.</p>';
            return;
        }

        // 4. (핵심) API로 받은 목록을 순회하며 '서로 다른' 링크를 가진 카드 생성
        reviewList.forEach(review => {
            // 📌 각 후기(review)의 고유 ID(review.id)를 상세 페이지 링크에 사용
            const detailPageLink = `myreview.html?reviewId=${review.id}`;
            
            // 5. 카드 HTML 생성
            const reviewCardHtml = createReviewCard(review, detailPageLink);
            
            // 6. 생성된 HTML을 컨테이너에 추가
            gridContainer.insertAdjacentHTML('beforeend', reviewCardHtml);
        });

    } catch (error) {
        console.error('Reviews Load Error:', error);
        gridContainer.innerHTML = `<p style="text-align: center; color: red;">${error.message}</p>`;
    }
}

/**
 * API 데이터로 후기 카드 HTML을 생성합니다.
 */
function createReviewCard(review, link) {
    // 1. (가정) review.comment에서 100자만 잘라내어 본문에 표시
    const bodySnippet = review.comment.length > 100 
        ? review.comment.substring(0, 100) + '…' 
        : review.comment;
        
    // 2. (가정) r-sub 필드는 난이도(difficulty) 값으로 대체
    // (API 응답 형식을 모국어로 변환: "EASY" -> "쉬움")
    const difficultyMap = { 'EASY': '쉬움', 'NORMAL': '보통', 'HARD': '어려움' };
    const subText = `난이도: ${difficultyMap[review.difficulty] || review.difficulty}`;

    // 3. (가정) 시간 포맷팅
    const timeText = formatTimeAgo(review.createdAt);

    // 4. (핵심) <article> 전체를 <a> 태그로 감싸서 링크를 만듭니다.
    return `
        <a href="${link}" class="review-card-link">
            <article class="review-card">
                <h3 class="r-title">${review.licenseName}</h3>
                <p class="r-sub">${subText}</p>
                <p class="r-body">${bodySnippet.replace(/\n/g, '<br>')}</p>
                <div class="r-meta">
                    <div class="avatar" aria-hidden="true">👤</div>
                    <div class="meta-text">${review.authorNickname} · ${timeText}</div>
                </div>
            </article>
        </a>
    `;
}

/**
 * CSS 파일에 .review-card-link 스타일 추가가 필요합니다.
 * (<a> 태그가 <article>의 스타일을 망가뜨리지 않도록)
 * * (예: ../css_vscode/review.css 맨 아래에 추가)
 * .review-card-link {
 * display: block;
 * text-decoration: none;
 * color: inherit;
 * border-radius: 12px;
 * }
 * .review-card-link:hover .review-card {
 * transform: translateY(-5px);
 * box-shadow: 0 8px 15px rgba(0,0,0,0.1);
 * }
 * .review-card {
 * transition: transform 0.2s ease, box-shadow 0.2s ease;
 * }
 */


/**
 * (Util) 날짜 문자열을 "N분 전", "N시간 전" 등으로 변환합니다.
 */
function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);

    let interval = seconds / 31536000; // 1년
    if (interval > 1) {
        return Math.floor(interval) + "년 전";
    }
    interval = seconds / 2592000; // 1달
    if (interval > 1) {
        return Math.floor(interval) + "달 전";
    }
    interval = seconds / 86400; // 1일
    if (interval > 1) {
        return Math.floor(interval) + "일 전";
    }
    interval = seconds / 3600; // 1시간
    if (interval > 1) {
        return Math.floor(interval) + "시간 전";
    }
    interval = seconds / 60; // 1분
    if (interval > 1) {
        return Math.floor(interval) + "분 전";
    }
    return Math.floor(seconds) + "초 전";
}