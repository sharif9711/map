// ✅ project-detail.js (중복 선언 제거 완전판)

// ================================
// 프로젝트 상세화면 표시 함수
// ================================
function showProjectDetail() {
    document.getElementById('projectListScreen').classList.remove('active');
    document.getElementById('projectDetailScreen').classList.add('active');

    const projectNameElement = document.getElementById('currentProjectName');
    if (projectNameElement && currentProject) {
        projectNameElement.textContent = currentProject.projectName;
    }

    // 기본 탭은 자료입력
    switchTab('자료입력');

    if (typeof renderDataInputTable === 'function') renderDataInputTable();
    if (typeof renderReportTable === 'function') renderReportTable();

    console.log('✅ Project detail view opened for:', currentProject.projectName);
}

// ================================
// 탭 전환
// ================================
function switchTab(tabName) {
    const tabs = ['자료입력', '보고서', '연결'];
    tabs.forEach(name => {
        document.getElementById(`content-${name}`).style.display =
            name === tabName ? 'block' : 'none';
        const tabButton = document.getElementById(`tab-${name}`);
        if (tabButton) {
            tabButton.classList.toggle('text-blue-600', name === tabName);
            tabButton.classList.toggle('border-blue-600', name === tabName);
            tabButton.classList.toggle('text-slate-600', name !== tabName);
            tabButton.classList.toggle('border-transparent', name !== tabName);
        }
    });
}

// ================================
// 자료입력 테이블 렌더링
// ================================
function renderDataInputTable() {
    const tableBody = document.getElementById('dataInputTable');
    if (!tableBody || !currentProject) return;
    tableBody.innerHTML = '';

    currentProject.data.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-slate-300 px-3 py-1 text-sm text-center">${row.순번}</td>
            <td class="border border-slate-300 px-3 py-1 text-sm">
                <input type="text" class="w-full px-2 py-1 border border-slate-300 rounded"
                       value="${row.이름 || ''}" 
                       onchange="updateCell('${row.id}', '이름', this.value)">
            </td>
            <td class="border border-slate-300 px-3 py-1 text-sm">
                <input type="text" class="w-full px-2 py-1 border border-slate-300 rounded"
                       value="${row.연락처 || ''}" 
                       onchange="updateCell('${row.id}', '연락처', this.value)">
            </td>
            <td class="border border-slate-300 px-3 py-1 text-sm">
                <input type="text" class="w-full px-2 py-1 border border-slate-300 rounded"
                       value="${row.주소 || ''}" 
                       onchange="updateCell('${row.id}', '주소', this.value)">
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// ================================
// 보고서 테이블 렌더링
// ================================
function renderReportTable() {
    const tableBody = document.getElementById('reportTable');
    if (!tableBody || !currentProject) return;
    tableBody.innerHTML = '';

    currentProject.data.forEach(row => {
        if (!row.주소 || row.주소.trim() === '') return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-slate-300 px-2 py-1 text-center">${row.순번}</td>
            <td class="border border-slate-300 px-2 py-1">${row.이름 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.연락처 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.주소 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.우편번호 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.상태 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.법정동코드 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.pnu코드 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.대장구분 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.본번 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.부번 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.지목 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.면적 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.기록사항 || ''}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// ================================
// PNU 코드 없는 행만 조회
// ================================
async function fetchLandInfoForReport() {
    if (!currentProject || !currentProject.data) return;

    const rowsToFetch = currentProject.data.filter(r => !r.pnu코드 || r.pnu코드.trim() === '');
    if (rowsToFetch.length === 0) {
        showToast('✅ 모든 행에 PNU 코드가 이미 있습니다.');
        return;
    }

    // 진행 막대
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.parentElement.style.display = 'block';
    }

    for (let i = 0; i < rowsToFetch.length; i++) {
        const row = rowsToFetch[i];
        try {
            const info = await getAddressDetailInfo(row.주소);
            if (info) {
                row.pnu코드 = info.pnu;
                row.지목 = info.jimok;
                row.면적 = info.area;
                row.본번 = info.main;
                row.부번 = info.sub;
                row.법정동코드 = info.pnu ? info.pnu.substring(0, 10) : '';
            }
        } catch (e) {
            console.error('토지 정보 조회 실패:', e);
        }

        if (progressBar) {
            const percent = Math.round(((i + 1) / rowsToFetch.length) * 100);
            progressBar.style.width = percent + '%';
        }
    }

    renderReportTable();
    showToast(`📍 PNU 없는 ${rowsToFetch.length}건의 토지정보 조회 완료`);
}

// ================================
// PNU, 지목, 면적 조회 (VWorld API 사용)
// ================================
async function getAddressDetailInfo(address) {
    const key = 'BE552462-0744-32DB-81E7-1B7317390D68';
    const url = `https://api.vworld.kr/ned/data/getLandCharacteristics?pnu=${encodeURIComponent(address)}&stdrYear=2017&format=json&numOfRows=10&pageNo=1&key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.response && data.response.result && data.response.result.featureCollection) {
            const field = data.response.result.featureCollection.features[0].properties;
            return {
                pnu: field.pnu || '',
                jimok: field.jimok || '',
                area: field.area || '',
                main: field.bonbun || '',
                sub: field.bubun || ''
            };
        }
    } catch (err) {
        console.error('Error fetching VWorld land info:', err);
    }
    return null;
}

// ================================
// 목록으로 돌아가기
// ================================
function backToList() {
    document.getElementById('projectDetailScreen').classList.remove('active');
    document.getElementById('projectListScreen').classList.add('active');
}
