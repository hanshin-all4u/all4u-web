// js_vscode/Q&A.js

const API_BASE = 'http://localhost:8080/api/qna';
const QNA_DETAIL_PAGE = 'Q&Afull.html'; // 상세 페이지

document.addEventListener('DOMContentLoaded', () => {
    // 1. URL에서 페이지 번호 가져오기 (없으면 0)
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0', 10);

    // 2. API 6.2 (Q&A 목록 조회) 호출
    loadQnaList(currentPage);
});

/**
 * (Helper) 인증 토큰이 있으면 헤더를 반환합니다.
 * (비밀글 마스킹 여부 확인을 위해 토큰 전송 권장)
 */
function getAuthHeader() {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        return { 'Authorization': `Bearer ${accessToken}` };
    }
    return {};
}

/**
 * API 6.2 (GET /api/qna)를 호출하여 목록을 렌더링합니다.
 */
async function loadQnaList(page = 0) {
    const gridContainer = document.querySelector('.reviews-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<p style="text-align: center;">Q&A 목록을 불러오는 중...</p>';

    try {
        // 📌 API 6.2 호출 (페이지, 사이즈, 정렬)
        const response = await fetch(
            `${API_BASE}?page=${page}&size=10&sort=createdAt,desc`, {
            method: 'GET',
            headers: getAuthHeader() 
        });

        if (!response.ok) {
            throw new Error(`[${response.status}] Q&A 목록을 불러오는데 실패했습니다.`);
        }

        const data = await response.json(); // Page<QnaResponseDto>

        gridContainer.innerHTML = ''; // 3. 기존 내용 비우기

        if (!data.content || data.content.length === 0) {
            gridContainer.innerHTML = '<p style="text-align: center; color: #888;">작성된 Q&A가 없습니다.</p>';
            return;
        }

        // 4. (핵심) 카드 생성
        data.content.forEach(qna => { // qna는 QnaResponseDto
            // 📌 상세 페이지 링크
            const detailPageLink = `${QNA_DETAIL_PAGE}?qnaId=${qna.id}`;
            
            // 5. 카드 HTML 생성 (API 6.2 데이터에 맞게)
            const qnaCardHtml = createQnaCard(qna, detailPageLink);
            
            gridContainer.insertAdjacentHTML('beforeend', qnaCardHtml);
        });

        // 5. 페이지네이션 렌더링
        renderPagination(data.pageable.pageNumber, data.totalPages);

    } catch (error) {
        console.error('Q&A Load Error:', error);
        gridContainer.innerHTML = `<p style="text-align: center; color: red;">${error.message}</p>`;
    }
}

/**
 * API 데이터(QnaResponseDto)로 카드 HTML을 생성합니다.
 * (Q&A.css의 .review-card 디자인을 재활용)
 */
function createQnaCard(qna, link) {
    // 1. 비밀글 아이콘
    const secretIcon = qna.secret ? '🔒 ' : '';
    
    // 2. 제목 (r-title)
    const title = secretIcon + qna.title;

    // 3. (디자인 맞춤) r-sub
    // 📌 Q&A API에는 r-sub에 쓸만한 '난이도' 같은 필드가 없습니다.
    // 📌 '작성일'을 대신 사용합니다.
    const timeText = formatTimeAgo(qna.createdAt);
    const subText = `작성일: ${new Date(qna.createdAt).toLocaleDateString('ko-KR')}`;

    // 4. 본문 (r-body)
    // 📌 API 6.2 명세: 타인 비밀글은 "비밀글입니다..."로 마스킹되어 옴
    const bodySnippet = qna.content.length > 100 
        ? qna.content.substring(0, 100) + '…' 
        : qna.content;

    // 5. (디자인 맞춤) r-meta
    const metaText = `${qna.authorNickname} · ${timeText}`;

    // 6. (핵심) 카드 전체를 <a> 태그로 감싸서 링크를 만듭니다.
    // (CSS에 .review-card-link 스타일이 추가되어 있어야 합니다.)
    const isMasked = qna.secret && qna.content.startsWith('비밀글입니다');
    
    // 📌 마스킹된 글(isMasked)은 링크를 걸지 않습니다. (div 사용)
    const Tag = isMasked ? 'div' : 'a';
    const href = isMasked ? '' : `href="${link}"`;

    return `
        <${Tag} ${href} class="review-card-link">
            <article class="review-card">
                <h3 class="r-title">${title}</h3>
                <p class="r-sub">${subText}</p>
                <p class="r-body">${bodySnippet.replace(/\n/g, '<br>')}</p>
                <div class="r-meta">
                    <div class="avatar" aria-hidden="true">👤</div>
                    <div class="meta-text">${metaText}</div>
                </div>
            </article>
        </${Tag}>
    `;
}

/**
 * 페이지네이션을 렌더링합니다. (Q&A.html 디자인 맞춤)
 */
function renderPagination(currentPage, totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = ''; 
    if (totalPages === 0) return;

    for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        const isActive = (i === currentPage) ? 'is-active' : '';
        
        // 📌 Q&A.html의 페이지네이션 HTML 구조에 맞게 수정
        const pageLink = `<a href="?page=${i}" class="page ${isActive}">${pageNumber}</a>`;
        pagination.insertAdjacentHTML('beforeend', pageLink);
    }
    // (next/prev 버튼 로직은 생략)
}


/**
 * (Util) 날짜 문자열을 "N분 전", "N시간 전" 등으로 변환합니다.
 */
function formatTimeAgo(dateString) {
    // ... (이전 답변의 formatTimeAgo 함수와 동일) ...
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);
    let interval = seconds / 3600; 
    if (interval > 24*30) { return new Date(dateString).toLocaleDateString('ko-KR'); }
    if (interval > 24) { return Math.floor(interval / 24) + "일 전"; }
    if (interval > 1) { return Math.floor(interval) + "시간 전"; }
    interval = seconds / 60;
    if (interval > 1) { return Math.floor(interval) + "분 전"; }
    return Math.floor(seconds) + "초 전";
}