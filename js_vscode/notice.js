// --- 1. DOM 요소 미리 찾아두기 ---
const tbody = document.getElementById('listBody');
const paginationContainer = document.querySelector('.pagination');
const searchForm = document.getElementById('inlineSearch');
const searchInput = searchForm.querySelector('input[name="q"]');
// 참고: 검색 <select>는 'field'
// const searchField = searchForm.querySelector('select[name="field"]');

// --- 2. 현재 상태 관리 ---
// (페이지네이션이나 검색 시 현재 상태를 기억하기 위함)
let currentState = {
  page: 0,       // API는 0페이지부터 시작
  keyword: '',
  // field: 'title' // (참고)
};

/**
 * 9.1 API 호출: 공지사항 목록 조회 (메인 함수)
 * @param {number} page - 조회할 페이지 번호 (0-based)
 * @param {string} keyword - 검색어
 */
async function fetchNotices(page = 0, keyword = '') {
  // 1. API URL 준비
  const size = 10; // 페이지당 10개 (API 기본값)
  const sort = 'createdAt,desc'; // 최신순 정렬 (API 기본값)
  
  // URLSearchParams를 사용하면 'keyword'가 비어있을 때 알아서 제외됩니다.
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  params.append('sort', sort);
  
  // API 명세(9.1)는 'keyword' 하나만 받습니다.
  // '제목'이든 '제목+내용'이든, 현재는 'q'의 값만 keyword로 넘깁니다.
  const q = keyword.trim();
  if (q) {
    params.append('keyword', q);
  }

  const url = `/api/notices?${params.toString()}`;

  // 2. API 호출
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    const pageData = await response.json(); // API 응답 (JSON)

    // 3. 현재 상태 업데이트 (API가 돌려준 실제 페이지 번호로)
    currentState.page = pageData.pageable.pageNumber;
    currentState.keyword = q;

    // 4. 화면 렌더링
    renderTable(pageData);       // 테이블 내용 갱신
    renderPagination(pageData);  // 페이지네이션 버튼 갱신
    
  } catch (error) {
    console.error('공지사항 로드 중 오류:', error);
    tbody.innerHTML = `<tr><td colspan="3">목록을 불러오는 중 오류가 발생했습니다.</td></tr>`;
  }
}

/**
 * 3. 테이블(tbody) 렌더링
 * @param {object} pageData - 9.1 API 응답 객체
 */
function renderTable(pageData) {
  const notices = pageData.content; // 실제 공지사항 목록
  
  // 최신순 'No' 번호를 계산하기 위한 시작 값
  const startNumber = pageData.totalElements - (pageData.pageable.pageNumber * pageData.pageable.pageSize);

  if (!notices || notices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">검색된 공지사항이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = notices.map((notice, index) => {
    // 날짜 포맷팅 (YYYY-MM-DD)
    const displayDate = notice.createdAt.split('T')[0];
    const noticeNo = startNumber - index; // 100, 99, 98...

    // 9.2 (상세조회)를 위해 id를 이용해 클릭 시 이동하도록 설정
    return `
      <tr style="cursor: pointer;" onclick="location.href='notice_detail.html?id=${notice.id}'">
        <td>${noticeNo}</td>
        <td title="${notice.title}">${notice.title}</td>
        <td>${displayDate}</td>
      </tr>
    `;
  }).join('');
}

/**
 * 4. 페이지네이션(pagination) 렌더링
 * (기존의 정적 버튼 대신 동적으로 버튼 생성)
 * @param {object} pageData - 9.1 API 응답 객체
 */
function renderPagination(pageData) {
  const { totalPages, number: currentPage } = pageData;
  const groupSize = 5; // 한 번에 보여줄 페이지 버튼 수 (1 2 3 4 5)
  
  // 현재 페이지 그룹 계산 (예: 0~4페이지 그룹, 5~9페이지 그룹)
  const startPage = Math.floor(currentPage / groupSize) * groupSize;

  let html = '';

  // '이전' 버튼 (첫 페이지 그룹이 아닐 때)
  html += `
    <button 
      class="page prev" 
      data-page="${startPage - 1}" 
      ${startPage === 0 ? 'style="visibility: hidden;"' : ''}
    >&lt;</button>`;

  // 페이지 번호 버튼
  for (let i = 0; i < groupSize; i++) {
    const pageNum = startPage + i;
    if (pageNum >= totalPages) break; // 총 페이지 수를 넘으면 중단

    html += `
      <button 
        class="page ${pageNum === currentPage ? 'current' : ''}" 
        data-page="${pageNum}"
      >${pageNum + 1}</button>`; // (사용자에겐 1부터 보이도록)
  }

  // '다음' 버튼 (다음 페이지 그룹이 있을 때)
  const hasNextGroup = startPage + groupSize < totalPages;
  html += `
    <button 
      class="page next" 
      data-page="${startPage + groupSize}" 
      ${!hasNextGroup ? 'style="visibility: hidden;"' : ''}
    >&gt;</button>`;

  paginationContainer.innerHTML = html;
}

// --- 5. 이벤트 리스너 연결 ---

/**
 * (수정) 검색 폼 제출 이벤트
 */
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const keyword = searchInput.value;
  
  // 검색 시, 0페이지(첫 페이지)부터 다시 조회
  fetchNotices(0, keyword);
});

/**
 * (수정) 페이지네이션 버튼 클릭 이벤트
 * (버튼이 동적으로 생성되므로 '이벤트 위임' 방식 사용)
 */
paginationContainer.addEventListener('click', (e) => {
  // 클릭된 요소가 '.page' 버튼인지 확인
  const button = e.target.closest('.page');
  if (!button) return; // 버튼이 아니면 무시

  // 'data-page' 속성에서 이동할 페이지 번호를 가져옴
  const page = parseInt(button.dataset.page, 10);

  if (isNaN(page)) return; // 숫자가 아니면 무시
  
  // API 호출 (현재 검색어는 유지)
  fetchNotices(page, currentState.keyword);
});

// --- 6. 초기 실행 ---
// 페이지가 처음 로드될 때, 0페이지(첫 페이지) 목록을 불러옴
fetchNotices(0, '');
