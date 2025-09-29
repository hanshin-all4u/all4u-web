document.getElementById("searchForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const query = document.getElementById("searchInput").value.trim();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>검색 중...</p>";

  if (!query) {
    resultsDiv.innerHTML = "<p class='no-results'>검색어를 입력하세요.</p>";
    return;
  }

  // 👉 백엔드 API 연동 자리
  fetch(`/api/search?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = "";

      if (data.results && data.results.length > 0) {
        data.results.forEach(item => {
          const div = document.createElement("div");
          div.className = "result-item";
          div.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.description || "설명이 없습니다."}</p>
            <a href="${item.link}">자세히 보기</a>
          `;
          resultsDiv.appendChild(div);
        });
      } else {
        resultsDiv.innerHTML = "<p class='no-results'>검색 결과가 없습니다.</p>";
      }
    })
    .catch(err => {
      console.error("검색 오류:", err);
      resultsDiv.innerHTML = "<p class='no-results'>오류가 발생했습니다.</p>";
    });
});
