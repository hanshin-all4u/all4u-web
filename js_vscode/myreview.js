// js_vscode/myreview.js

// 📌 API 엔드포인트
const REVIEW_API_BASE = 'http://localhost:8080/api/reviews'; 
const COMMENT_API_BASE = 'http://localhost:8080/api/comments'; 
const REVIEW_LIST_PAGE = 'review.html'; 

// 📌 [가정] 현재 로그인한 사용자의 닉네임 (가져오기)
// 1단계에서 localStorage에서 읽어오도록 구현되어 있습니다.

// ----------------------------------------------------------------------
// [ 1. 초기화 ] DOMContentLoaded 이벤트 리스너
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reviewId = urlParams.get('reviewId');

    if (!reviewId) {
        alert('후기 ID가 올바르지 않습니다. 목록으로 돌아갑니다.');
        window.location.href = REVIEW_LIST_PAGE;
        return;
    }

    // 전역으로 reviewId 저장 (답글 작성 시 필요)
    window.currentReviewId = reviewId;

    loadReviewPage(reviewId);

    document.querySelector('.list-btn')?.addEventListener('click', () => {
        window.location.href = REVIEW_LIST_PAGE; 
    });
    
    document.querySelector('.comment-form button')?.addEventListener('click', async () => {
        const textarea = document.querySelector('.comment-form textarea');
        const content = textarea.value.trim();
        
        if (content === "") {
            textarea.focus();
            return;
        }

        // 새 댓글 API 호출 (이것은 parentId가 없는 최상위 댓글)
        await handleCommentSubmit(reviewId, content, null); // 📌 parentId로 null 전달
        
        textarea.value = '';
        
        // 댓글 목록 새로고침
        await loadComments(reviewId, window.currentReviewAuthor); 
    });

    // 📌 [2단계] 이벤트 리스너를 'attachCommentActionListeners'로 통합 (1회만 실행)
    attachCommentActionListeners();
});

// ----------------------------------------------------------------------
// [ 2. 페이지 로딩 (1단계와 동일) ]
// ----------------------------------------------------------------------

function getAuthHeader() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        console.warn('[API] AccessToken이 없습니다.');
        return {};
    }
    return { 'Authorization': `Bearer ${accessToken}` };
}

async function loadReviewPage(reviewId) {
    try {
        const reviewResponse = await fetch(`${REVIEW_API_BASE}/${reviewId}`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!reviewResponse.ok) {
            throw new Error(`[${reviewResponse.status}] 후기 정보를 불러오는데 실패했습니다.`);
        }
        
        const reviewData = await reviewResponse.json();
        
        const currentUserNickname = localStorage.getItem('userNickname');
        window.currentReviewAuthor = reviewData.authorNickname; // 전역 저장

        renderReview(reviewData, currentUserNickname);
        await loadComments(reviewId, reviewData.authorNickname);

    } catch (error) {
        console.error('페이지 로드 오류:', error);
        alert(error.message || '페이지 로드 중 오류가 발생했습니다.');
    }
}

async function loadComments(reviewId, reviewAuthorNickname) {
    try {
        const commentsResponse = await fetch(`${REVIEW_API_BASE}/${reviewId}/comments`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!commentsResponse.ok) {
            throw new Error(`[${commentsResponse.status}] 댓글을 불러오는데 실패했습니다.`);
        }
        
        const commentList = await commentsResponse.json();
        const currentUserNickname = localStorage.getItem('userNickname');

        // 📌 [2단계] 댓글 렌더링 (대댓글 로직으로 변경됨)
        renderComments(commentList, reviewAuthorNickname, currentUserNickname);
        
        // 📌 [1단계] 이벤트 리스너 연결 (DOMContentLoaded로 이동함)
        // attachCommentActionListeners(); // -> 중복 방지를 위해 DOMContentLoaded에서 1회만 실행

    } catch (error)
    {
        console.error('댓글 로드 오류:', error);
        alert(error.message || '댓글 로드 중 오류가 발생했습니다.');
    }
}


// ----------------------------------------------------------------------
// [ 3. 렌더링 함수 (2단계: 대댓글 로직으로 수정) ]
// ----------------------------------------------------------------------

/**
 * (1단계와 동일) 4.3 API 응답으로 후기 본문을 채웁니다.
 */
function renderReview(reviewData, currentUserNickname) {
    // 1. 후기 ID 설정 (삭제/수정 시 JS가 참조)
    const reviewBox = document.querySelector('.review-box');
    if (reviewBox) {
        reviewBox.dataset.reviewId = reviewData.id;
    }
    
    // 2. DOM 요소에 데이터 바인딩
    document.querySelector('.review-box h2').textContent = reviewData.title; // (가정) title 필드
    document.querySelector('.post-author .author-name').textContent = reviewData.authorNickname;
    document.querySelector('.post-author .post-date').textContent = 
        new Date(reviewData.createdAt).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    document.querySelector('.review-body').innerHTML = reviewData.comment.replace(/\n/g, '<br>'); 
    
    // 3. 후기 수정/삭제 버튼 표시 여부
    const actionsContainer = document.querySelector('.review-actions');
    if (actionsContainer) {
        if (currentUserNickname === reviewData.authorNickname) {
            actionsContainer.style.display = 'flex'; 
            
            // (1단계) 버튼에 이벤트 리스너 연결
            actionsContainer.querySelector('.edit-btn')
                ?.addEventListener('click', () => handleReviewEditClick(reviewData.id));
            actionsContainer.querySelector('.delete-btn')
                ?.addEventListener('click', () => handleReviewDeleteClick(reviewData.id));
        } else {
            actionsContainer.style.display = 'none';
        }
    }
}


/**
 * (신규) 댓글 1개의 HTML을 생성하는 헬퍼 함수
 */
function createCommentCardHtml(comment, isReply, reviewAuthorNickname, currentUserNickname) {
    const cardClass = isReply ? 'comment-reply comment-card' : 'comment-card';
    
    // 1. (글쓴이) 태그
    const authorTag = (comment.authorNickname === reviewAuthorNickname) 
        ? '<span class="author-tag">(글쓴이)</span>' : '';

    // 2. (본인) 수정/삭제 버튼
    let buttonsHtml = '<button class="reply-btn">답글</button>'; 
    if (currentUserNickname === comment.authorNickname) {
        buttonsHtml = `
            <button class="comment-edit-btn">수정</button>
            <button class="comment-delete-btn">삭제</button>
            ${buttonsHtml}
        `;
    }

    // 3. 날짜
    const commentDate = new Date(comment.createdAt).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });

    // 4. 최종 HTML
    return `
        <div class="${cardClass}" data-comment-id="${comment.id}">
            <div class="comment-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332C3.154 11.91 3 12.65 3 12.996V13z"/>
                </svg>
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <strong>${comment.authorNickname}</strong>
                    ${authorTag}
                    <span class="comment-date">${commentDate}</span>
                </div>
                <div class="comment-body">
                    <p>${comment.content.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="comment-footer">
                    ${buttonsHtml}
                </div>
                <div class="reply-container"></div>
            </div>
        </div>
    `;
}

/**
 * (2단계 수정) 5.2 API 응답으로 대댓글 구조를 렌더링합니다.
 */
function renderComments(commentList, reviewAuthorNickname, currentUserNickname) {
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;

    commentSection.innerHTML = ''; // 1. 기존 댓글 비우기

    if (!commentList || commentList.length === 0) {
        commentSection.innerHTML = '<p style="text-align: center; color: #888;">작성된 댓글이 없습니다.</p>';
        return;
    }

    // 2. [가정] API 응답에 parentId 필드가 있다고 가정합니다. (없으면 대댓글 구현 불가)
    const commentsById = new Map();
    commentList.forEach(c => commentsById.set(c.id, c));

    // 3. 부모-자식 관계 설정
    const repliesByParentId = new Map();
    const topLevelComments = [];

    commentList.forEach(c => {
        // (가정) c.parentId 필드가 존재
        if (c.parentId && commentsById.has(c.parentId)) {
            if (!repliesByParentId.has(c.parentId)) {
                repliesByParentId.set(c.parentId, []);
            }
            repliesByParentId.get(c.parentId).push(c);
        } else {
            topLevelComments.push(c); // 부모가 없거나, (삭제 등으로) 찾을 수 없으면 최상위
        }
    });

    // 4. 최상위 댓글부터 렌더링
    topLevelComments.forEach(comment => {
        const commentHtml = createCommentCardHtml(comment, false, reviewAuthorNickname, currentUserNickname);
        commentSection.insertAdjacentHTML('beforeend', commentHtml);
    });

    // 5. 대댓글(답글) 렌더링
    repliesByParentId.forEach((replies, parentId) => {
        // 부모 댓글의 .reply-container를 찾음
        const parentCard = commentSection.querySelector(`.comment-card[data-comment-id="${parentId}"]`);
        const replyContainer = parentCard?.querySelector('.reply-container');
        if (!replyContainer) return; // 부모 댓글 DOM이 없으면 스킵

        replies.forEach(reply => {
            const replyHtml = createCommentCardHtml(reply, true, reviewAuthorNickname, currentUserNickname);
            replyContainer.insertAdjacentHTML('beforeend', replyHtml);
        });
    });
}

// ----------------------------------------------------------------------
// [ 4. API 호출 함수 (2단계 수정) ]
// ----------------------------------------------------------------------

/**
 * (2단계 수정) 5.1 새 댓글 또는 답글 작성
 */
async function handleCommentSubmit(reviewId, content, parentId) {
    if (!reviewId) { alert('후기 ID를 찾을 수 없습니다.'); return; }

    // 📌 [가정] API가 { content, parentId }를 받는다고 가정합니다.
    // parentId가 null이면 최상위, 값이 있으면 대댓글
    const body = { 
        content: content,
        parentId: parentId 
    };

    // (API 스펙에 parentId가 없다면 content만 보냄)
    // const body = { content: content };
    // if(parentId) body.parentId = parentId; // (parentId가 null일 때 안보내기)

    try {
        const response = await fetch(`${REVIEW_API_BASE}/${reviewId}/comments`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.status === 201) { 
            console.log('댓글/답글이 성공적으로 등록되었습니다.');
            // (중요) 댓글 목록을 새로고침합니다.
            await loadComments(reviewId, window.currentReviewAuthor);
        } else {
            const errorData = await response.json();
            alert(errorData.message || '댓글 등록에 실패했습니다.');
        }

    } catch (error) {
        console.error('Submit Comment Error:', error);
        alert('댓글 등록 중 네트워크 오류가 발생했습니다.');
    }
}


/**
 * (1단계와 동일) 4.5 후기 글 삭제
 */
async function handleReviewDeleteClick(reviewId) {
    if (!reviewId) { alert('후기 ID를 찾을 수 없습니다.'); return; }
    if (!confirm('정말로 이 후기 글을 삭제하시겠습니까?')) { return; }
    
    try {
        const response = await fetch(`${REVIEW_API_BASE}/${reviewId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (response.status === 204) { 
            alert('후기 글이 성공적으로 삭제되었습니다.');
            window.location.href = REVIEW_LIST_PAGE; 
        } else {
            alert('삭제 권한이 없거나 서버 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Delete Review Error:', error);
        alert('삭제 요청 중 네트워크 오류가 발생했습니다.');
    }
}

/**
 * (1단계와 동일) 4.4 후기 글 수정 (페이지 이동)
 */
function handleReviewEditClick(reviewId) {
    if (!reviewId) { alert('후기 ID를 찾을 수 없습니다.'); return; }
    window.location.href = `review_edit.html?reviewId=${reviewId}`; 
}


/**
 * (1단계와 동일) 5.4 댓글 삭제
 */
async function handleCommentDeleteClick(commentId) {
    if (!commentId) { alert('댓글 ID를 찾을 수 없습니다.'); return; }
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) { return; }
    
    try {
        const response = await fetch(`${COMMENT_API_BASE}/${commentId}`, { 
            method: 'DELETE',
            headers: getAuthHeader()
        });

        if (response.status === 204) { 
            alert('댓글이 성공적으로 삭제되었습니다.');
            // DOM에서 바로 삭제
            const commentCardToRemove = document.querySelector(`.comment-card[data-comment-id="${commentId}"]`);
            commentCardToRemove?.remove();
        } else {
            alert('삭제 권한이 없거나 서버 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Delete Comment Error:', error);
        alert('삭제 요청 중 네트워크 오류가 발생했습니다.');
    }
}

/**
 * (2단계 신규) 5.3 댓글 수정 (인라인 폼)
 */
async function handleCommentEditClick(commentId) {
    if (!commentId) { alert('댓글 ID를 찾을 수 없습니다.'); return; }

    // 1. 다른 수정 폼이 열려있으면 닫기
    cancelAllCommentEdits();

    // 2. 대상 DOM 찾기
    const commentCard = document.querySelector(`.comment-card[data-comment-id="${commentId}"]`);
    if (!commentCard) return;
    
    const commentBody = commentCard.querySelector('.comment-body');
    const commentFooter = commentCard.querySelector('.comment-footer');
    
    const originalText = commentBody.querySelector('p').textContent;

    // 3. 원본 HTML 저장 (취소 시 복구용)
    commentBody.dataset.originalContent = commentBody.innerHTML;
    commentFooter.dataset.originalContent = commentFooter.innerHTML;
    
    // 4. 수정 UI로 교체
    commentBody.innerHTML = `
        <textarea class="edit-textarea" rows="3">${originalText}</textarea>
    `;
    commentFooter.innerHTML = `
        <button type="button" class="edit-cancel-btn">취소</button>
        <button type="button" class="edit-submit-btn">수정 완료</button>
    `;

    // 5. 새 버튼에 이벤트 리스너 연결
    // 5-1. 취소 버튼
    commentFooter.querySelector('.edit-cancel-btn').addEventListener('click', () => {
        commentBody.innerHTML = commentBody.dataset.originalContent;
        commentFooter.innerHTML = commentFooter.dataset.originalContent;
    });

    // 5-2. 수정 완료 버튼 (API 5.3 호출)
    commentFooter.querySelector('.edit-submit-btn').addEventListener('click', async () => {
        const newContent = commentBody.querySelector('.edit-textarea').value.trim();
        if (!newContent) {
            alert('내용을 입력하세요.');
            return;
        }

        try {
            const response = await fetch(`${COMMENT_API_BASE}/${commentId}`, {
                method: 'PATCH',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            if (response.ok) {
                // 성공: 200 OK
                const updatedComment = await response.json();
                // DOM 업데이트 및 원본 버튼 복원
                commentBody.innerHTML = `<p>${updatedComment.content.replace(/\n/g, '<br>')}</p>`;
                commentFooter.innerHTML = commentFooter.dataset.originalContent;
            } else {
                // 실패
                alert('댓글 수정에 실패했습니다. (권한 없음 등)');
                // 원상 복구
                commentBody.innerHTML = commentBody.dataset.originalContent;
                commentFooter.innerHTML = commentFooter.dataset.originalContent;
            }
        } catch (error) {
            console.error('Edit Comment Error:', error);
            alert('댓글 수정 중 네트워크 오류가 발생했습니다.');
        }
    });
}

/**
 * (2단계 신규) 모든 인라인 수정 폼을 취소(복구)합니다.
 */
function cancelAllCommentEdits() {
    document.querySelectorAll('.comment-card').forEach(card => {
        const commentBody = card.querySelector('.comment-body');
        const commentFooter = card.querySelector('.comment-footer');

        // data-originalContent가 있다는 것은 수정 중이라는 의미
        if (commentBody.dataset.originalContent) {
            commentBody.innerHTML = commentBody.dataset.originalContent;
            delete commentBody.dataset.originalContent;
        }
        if (commentFooter.dataset.originalContent) {
            commentFooter.innerHTML = commentFooter.dataset.originalContent;
            delete commentFooter.dataset.originalContent;
        }
    });
}

// ----------------------------------------------------------------------
// [ 5. 이벤트 리스너 연결 (2단계 수정) ]
// ----------------------------------------------------------------------

/**
 * (1단계) 답글 폼 생성
 */
function createReplyForm() {
    // 1. 기존 폼이 있다면 닫기
    const existingForm = document.querySelector('.reply-form-container');
    existingForm?.remove();
    
    const formContainer = document.createElement('div');
    formContainer.className = 'reply-form-container'; 
    formContainer.innerHTML = `
        <textarea placeholder="답글을 입력하세요..." rows="3"></textarea>
        <div class="reply-form-buttons">
            <button type="button" class="reply-cancel-btn">취소</button>
            <button type="button" class="reply-submit-btn">등록</button>
        </div>
    `;
    return formContainer;
}

/**
 * (2단계 수정) 답글 버튼 클릭 핸들러 (API 5.1 호출)
 */
function handleReplyClick(event) {
    event.preventDefault(); 
    
    // 1. 답글을 달 부모 댓글 DOM
    const parentCommentCard = event.target.closest('.comment-card');
    const parentCommentContent = event.target.closest('.comment-content');
    if (!parentCommentCard || !parentCommentContent) return;

    // 2. 부모 댓글 ID
    const parentId = parentCommentCard.dataset.commentId;
    
    // 3. 폼 생성 및 삽입
    const replyForm = createReplyForm();
    parentCommentContent.appendChild(replyForm);
    
    // 4. 취소 버튼
    replyForm.querySelector('.reply-cancel-btn').addEventListener('click', () => {
        replyForm.remove(); 
    });
    
    // 5. 등록 버튼 (API 5.1 호출)
    replyForm.querySelector('.reply-submit-btn').addEventListener('click', async () => {
        const replyText = replyForm.querySelector('textarea').value;
        if (replyText.trim() === "") {
            replyForm.querySelector('textarea').focus();
            return;
        }
        
        // 📌 (중요) 전역 변수에서 reviewId 가져오기
        const reviewId = window.currentReviewId; 
        
        // 📌 API 5.1 호출 (parentId와 함께)
        await handleCommentSubmit(reviewId, replyText, parentId);
        
        // (handleCommentSubmit이 성공하면 loadComments를 호출하므로 폼은 자동으로 닫힘)
        // (만약의 경우를 대비해 여기서도 폼을 닫음)
        replyForm.remove();
    });

    replyForm.querySelector('textarea').focus();
}

/**
 * (1단계) 이벤트 위임(Delegation)을 사용하여 댓글 섹션 전체에 리스너 1개만 연결
 */
function attachCommentActionListeners() {
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;

    commentSection.addEventListener('click', (event) => {
        const target = event.target;
        
        const commentCard = target.closest('.comment-card');
        if (!commentCard) return;
        
        const commentId = commentCard.dataset.commentId;
        if (!commentId) return;

        // 1. 답글 버튼
        if (target.matches('.reply-btn')) {
            handleReplyClick(event);
            return;
        }
        // 2. 수정 버튼
        if (target.matches('.comment-edit-btn')) {
            handleCommentEditClick(commentId);
            return;
        }
        // 3. 삭제 버튼
        if (target.matches('.comment-delete-btn')) {
            handleCommentDeleteClick(commentId);
            return;
        }
    });
}