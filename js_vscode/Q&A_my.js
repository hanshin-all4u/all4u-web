// js_vscode/Q&Afull.js

// 📌 API 엔드포인트
const API_BASE = 'http://localhost:8080/api/qna';
const QNA_LIST_PAGE = 'Q&A.html'; // 📌 목록 페이지 파일명

// ----------------------------------------------------------------------
// [ 1. 초기화 ]
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. URL에서 qnaId 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const qnaId = urlParams.get('qnaId'); // 📌 'reviewId'가 아닌 'qnaId'

    if (!qnaId) {
        alert('Q&A ID가 올바르지 않습니다. 목록으로 돌아갑니다.');
        window.location.href = QNA_LIST_PAGE;
        return;
    }

    // 2. API 6.3 (Q&A 상세 조회) 호출
    loadQnaDetail(qnaId);

    // 3. 목록 버튼 이벤트
    document.querySelector('.list-btn')?.addEventListener('click', () => {
        window.location.href = QNA_LIST_PAGE; 
    });

    // 4. 📌 [API 불일치] 
    // Q&A API(6.x)에는 댓글 기능이 없으므로, 댓글 관련 모든 JS 코드를 삭제합니다.
    // '댓글 등록' 버튼이 눌려도 아무 작업도 하지 않습니다.
    // (또는, 관리자 답변용이므로 비활성화)
    const commentButton = document.querySelector('.comment-form button');
    if(commentButton) {
        commentButton.disabled = true;
        commentButton.textContent = '답변은 관리자만 작성 가능합니다.';
        commentButton.style.cursor = 'not-allowed';
        commentButton.style.backgroundColor = '#eee';
    }
});

// ----------------------------------------------------------------------
// [ 2. 페이지 로딩 ]
// ----------------------------------------------------------------------

function getAuthHeader() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        console.warn('[API] AccessToken이 없습니다.');
        return {};
    }
    return { 'Authorization': `Bearer ${accessToken}` };
}

/**
 * API 6.3 (GET /api/qna/{qnaId}) 호출
 */
async function loadQnaDetail(qnaId) {
    try {
        const response = await fetch(`${API_BASE}/${qnaId}`, {
            method: 'GET',
            headers: getAuthHeader() // 📌 비밀글 조회를 위해 인증 헤더 전송
        });

        if (response.status === 403) { // 📌 타인 비밀글 조회 시도
            alert('이 게시글을 조회할 권한이 없습니다.');
            window.location.href = QNA_LIST_PAGE;
            return;
        }
        if (!response.ok) {
            throw new Error(`[${response.status}] Q&A 정보를 불러오는데 실패했습니다.`);
        }
        
        const qnaData = await response.json(); // QnaResponseDto
        
        // 📌 (가정) 로그인한 사용자의 닉네임
        const currentUserNickname = localStorage.getItem('userNickname');

        renderQna(qnaData, currentUserNickname);

        // 📌 [API 불일치] 댓글 조회(loadComments) 로직 삭제

    } catch (error) {
        console.error('Q&A 상세 로드 오류:', error);
        alert(error.message || '페이지 로드 중 오류가 발생했습니다.');
    }
}

// ----------------------------------------------------------------------
// [ 3. 렌더링 함수 ]
// ----------------------------------------------------------------------

/**
 * API 6.3 응답으로 Q&A 본문을 채웁니다.
 * (HTML의 .review-box 디자인을 재활용)
 */
function renderQna(qnaData, currentUserNickname) {
    const qnaBox = document.querySelector('.review-box'); 
    if (!qnaBox) return;

    // 1. Q&A ID 설정 (삭제 시 참조)
    qnaBox.dataset.qnaId = qnaData.id;
    
    // 2. DOM 요소에 데이터 바인딩
    const secretIcon = qnaData.secret ? '🔒 ' : '';
    document.querySelector('.review-box h2').textContent = secretIcon + qnaData.title;
    document.querySelector('.post-author .author-name').textContent = qnaData.authorNickname;
    document.querySelector('.post-author .post-date').textContent = 
        new Date(qnaData.createdAt).toLocaleString('ko-KR');
    
    document.querySelector('.review-body').innerHTML = qnaData.content.replace(/\n/g, '<br>');
    
    // 3. Q&A 삭제 버튼 표시 여부
    const actionsContainer = document.querySelector('.review-actions');
    if (actionsContainer) {
        // (가정) 로그인한 사용자와 글쓴이가 같을 때만 버튼 표시
        if (currentUserNickname === qnaData.authorNickname) {
            actionsContainer.style.display = 'flex';
            
            // 4. API 6.5 (Q&A 삭제) 이벤트 연결
            actionsContainer.querySelector('.delete-btn')
                ?.addEventListener('click', () => handleQnaDeleteClick(qnaData.id));
        } else {
            actionsContainer.style.display = 'none';
        }
    }

    // 4. 📌 [API 불일치] 댓글 렌더링(renderComments) 로직 삭제
    // (디자인은 유지하되, 댓글 섹션을 비워둠)
    const commentSection = document.querySelector('.comment-section');
    if(commentSection) {
        // 📌 Q&Afull.html에 하드코딩된 '관리자' 댓글을 삭제합니다.
        commentSection.innerHTML = '<p style="text-align: center; color: #888;">관리자 답변을 기다리고 있습니다.</p>';
    }
}

// ----------------------------------------------------------------------
// [ 4. API 호출 함수 ]
// ----------------------------------------------------------------------

/**
 * API 6.5 (DELETE /api/qna/{qnaId}) 호출
 */
async function handleQnaDeleteClick(qnaId) {
    if (!qnaId) { alert('Q&A ID를 찾을 수 없습니다.'); return; }
    if (!confirm('정말로 이 문의글을 삭제하시겠습니까?')) { return; }
    
    try {
        const response = await fetch(`${API_BASE}/${qnaId}`, {
            method: 'DELETE',
            headers: getAuthHeader() // 📌 인증 필수
        });

        if (response.status === 204) { // 204 No Content
            alert('문의글이 성공적으로 삭제되었습니다.');
            window.location.href = QNA_LIST_PAGE; // 목록으로 이동
        } else {
            alert('삭제 권한이 없거나 서버 오류가 발생했습니다.');
        }

    } catch (error) {
        console.error('Delete Q&A Error:', error);
        alert('삭제 요청 중 네트워크 오류가 발생했습니다.');
    }
}

// ----------------------------------------------------------------------
// [ 5. [삭제] ]
// ----------------------------------------------------------------------
// 📌 '후기(Review)'와 '댓글(Comment)' 관련 함수는 모두 삭제합니다.
// (handleCommentSubmit, handleCommentDeleteClick, handleCommentEditClick,
//  createCommentCardHtml, renderComments, createReplyForm, handleReplyClick,
//  attachCommentActionListeners 등)
// ----------------------------------------------------------------------
