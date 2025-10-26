// js_vscode/license.js

/**
 * ../js_vscode/license.js
 * * 자격증 API를 호출하여 대분류 -> 중분류 -> 소분류 계층 구조로 표시하는 스크립트입니다.
 */

const API_BASE_URL = 'http://localhost:8080/api';
const LICENSES_ENDPOINT = `${API_BASE_URL}/licenses?size=1000`; // 모든 자격증 가져오기

// Mock 데이터 (API 실패 시 사용)
const MOCK_LICENSE_DATA = [
    { jmcd: "1", mdobligfldnm: "에너지.기상", obligfldnm: "환경.에너지", jmfldnm: "에너지관리기사" },
    { jmcd: "2", mdobligfldnm: "에너지.기상", obligfldnm: "환경.에너지", jmfldnm: "기상기사" },
    // ... (나머지 Mock 데이터 생략) ...
    { jmcd: "20", mdobligfldnm: "전문자격", obligfldnm: "지도사/평가사", jmfldnm: "경영지도사(마케팅)" },
];

const mainGrid = document.querySelector('.main-grid');

/**
 * 자격증 데이터를 계층 구조(Tree)로 변환합니다.
 */
function buildLicenseTree(data) {
    const tree = {};
    data.forEach(item => {
        const md = (item.mdobligfldnm || '기타').trim();
        const ob = (item.obligfldnm || '기타 분류').trim();
        const jmName = item.jmfldnm;
        const jmId = item.jmcd;

        if (!jmName || !jmId) return;

        if (!tree[md]) tree[md] = {};
        if (!tree[md][ob]) tree[md][ob] = [];
        tree[md][ob].push({ id: jmId, name: jmName });
    });

    // 정렬
    const sortedTree = {};
    Object.keys(tree).sort().forEach(mdKey => {
        sortedTree[mdKey] = {};
        Object.keys(tree[mdKey]).sort().forEach(obKey => {
            sortedTree[mdKey][obKey] = tree[mdKey][obKey].sort((a, b) => a.name.localeCompare(b.name));
        });
    });
    return sortedTree;
}

/**
 * 대분류 Panel을 생성하고 이벤트 리스너를 추가합니다.
 */
function createMajorCategoryPanel(mdName, obligfldnms) {
    const panel = document.createElement('div');
    panel.className = 'panel panel-soft';
    const header = document.createElement('h3');
    header.textContent = mdName;
    panel.appendChild(header);
    const subContainer = document.createElement('ul');
    subContainer.className = 'oblig-list hidden';

    for (const obName in obligfldnms) {
        const obData = obligfldnms[obName];
        const obItem = document.createElement('li');
        obItem.className = 'oblig-item';
        const obNameHeader = document.createElement('div');
        obNameHeader.className = 'oblig-name';
        obNameHeader.innerHTML = `<span>${obName}</span> <span>(${obData.length}개)</span>`;
        obItem.appendChild(obNameHeader);
        const jmList = document.createElement('ul');
        jmList.className = 'jmfld-list hidden';
        obData.forEach(jm => {
            const jmItem = document.createElement('li');
            jmItem.className = 'jmfld-item';

            // ▼▼▼ [수정] href 속성에서 '.html' 확장자 제거 ▼▼▼
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', `certificate_detail?jmcd=${encodeURIComponent(jm.id)}`); // '.html' 제거
            linkElement.textContent = jm.name;
            jmItem.appendChild(linkElement);
            // ▲▲▲ [수정] href 속성에서 '.html' 확장자 제거 ▲▲▲

            jmList.appendChild(jmItem);
        });
        obItem.appendChild(jmList);
        obNameHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            jmList.classList.toggle('hidden');
        });
        subContainer.appendChild(obItem);
    }
    panel.appendChild(subContainer);
    header.addEventListener('click', () => {
        subContainer.classList.toggle('hidden');
        header.classList.toggle('active');
    });

    if (mainGrid && typeof mainGrid.appendChild === 'function') {
        mainGrid.appendChild(panel);
    } else {
        console.error(`Cannot append panel for [${mdName}] because mainGrid is invalid!`);
    }
}

/**
 * API 호출 및 전체 목록 렌더링을 시작합니다.
 */
async function initializeLicenseGrid() {
    if (!mainGrid) {
        console.error('.main-grid element not found. Aborting.');
        document.body.insertAdjacentHTML('beforeend', '<p style="color: red; font-weight: bold; padding: 20px;">오류: 페이지 구조(.main-grid)를 찾을 수 없어 자격증 목록을 표시할 수 없습니다.</p>');
        return;
    }
    mainGrid.innerHTML = '<div class="panel panel-soft" style="aspect-ratio: auto; grid-column: 1 / -1;"><h3 style="cursor: default;">자격증 목록을 불러오는 중...</h3></div>';

    let licenseData = [];
    try {
        const response = await fetch(LICENSES_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        licenseData = responseData.content || [];
    } catch (error) {
        console.error("API 호출 중 오류 발생. Mock 데이터를 사용합니다.", error);
        licenseData = MOCK_LICENSE_DATA;
    }

    if (!mainGrid) return;
    mainGrid.innerHTML = '';

    if (licenseData.length === 0) {
        mainGrid.innerHTML = '<div class="panel panel-soft" style="aspect-ratio: auto; grid-column: 1 / -1;"><h3 style="cursor: default;">등록된 자격증 정보가 없습니다.</h3></div>';
        return;
    }

    const licenseTree = buildLicenseTree(licenseData);
    let panelCount = 0;
    for (const mdName in licenseTree) {
        createMajorCategoryPanel(mdName, licenseTree[mdName]);
        panelCount++;
    }
    console.log(`총 ${panelCount}개의 대분류 패널 생성을 시도했습니다.`);
}

// 페이지 로드 시 함수 실행
document.addEventListener('DOMContentLoaded', initializeLicenseGrid);
