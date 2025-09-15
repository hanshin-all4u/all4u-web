// 데모 데이터 렌더링
const data = Array.from({length: 10}).map((_, i) => ({
  no: i + 1,
  title: i === 0 ? '최신 공지(예시) : 2024년 2학기 수강신청 안내' : `자료 이름 ${i+1}`,
  date: `2025-09-${String(i+1).padStart(2,'0')}`,
  file: i % 3 === 0 ? '📎' : ''
}));

const tbody = document.getElementById('listBody');
tbody.innerHTML = data.map(r => `
  <tr>
    <td>${r.no}</td>
    <td title="${r.title}">${r.title}</td>
    <td>${r.date}</td>
    <td style="text-align:center">${r.file}</td>
  </tr>
`).join('');

// 페이지네이션(하이라이트만)
document.querySelectorAll('.pagination .page').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    if(btn.dataset.page === 'next'){
      const cur = document.querySelector('.pagination .current');
      const next = cur.nextElementSibling && cur.nextElementSibling.classList.contains('page') ? cur.nextElementSibling : null;
      if(next && !next.classList.contains('next')) { cur.classList.remove('current'); next.classList.add('current'); }
      return;
    }
    document.querySelector('.pagination .current')?.classList.remove('current');
    btn.classList.add('current');
    // 실제 페이지 전환은 이후 API 연동 시 교체
  });
});

// 하단 검색(데모: 제목 필터)
document.getElementById('inlineSearch')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = new FormData(e.target).get('q').toString().trim();
  const field = new FormData(e.target).get('field');
  const rows = [...tbody.rows];
  rows.forEach(tr=>{
    const text = tr.cells[field === 'date' ? 2 : 1].textContent.toLowerCase();
    tr.style.display = q ? (text.includes(q.toLowerCase()) ? '' : 'none') : '';
  });
});
