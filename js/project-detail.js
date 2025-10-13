// ✅ 프로젝트 상세 화면 표시
function showProjectDetail() {
    document.getElementById('projectListScreen').classList.add('hidden');
    document.getElementById('projectDetailScreen').classList.remove('hidden');
    document.getElementById('currentProjectName').textContent = currentProject.projectName;

    // 지도 버튼 표시
    const mapBtn = document.getElementById('mapViewButton');
    if (mapBtn) {
        const mapTypeText = currentProject.mapType === 'vworld' ? 'VWorld' : '카카오맵';
        mapBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            지도 (${mapTypeText})
        `;
    }

    switchTab('자료입력');
    renderDataInputTable();
    renderReportTable();
    updateMapCount();
}

// ✅ 목록으로 돌아가기
function backToList() {
    document.getElementById('projectDetailScreen').classList.add('hidden');
    document.getElementById('projectListScreen').classList.remove('hidden');
    currentProject = null;
}

// ✅ 탭 전환
function switchTab(tabName) {
    const tabs = ['자료입력', '보고서', '연결'];
    tabs.forEach(tab => {
        const tabBtn = document.getElementById('tab-' + tab);
        const content = document.getElementById('content-' + tab);

        if (!tabBtn || !content) return;

        if (tab === tabName) {
            tabBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            content.style.display = 'block';
            if (tab === '보고서') fetchLandInfoForReport();
        } else {
            tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            content.style.display = 'none';
        }
    });
}

// ✅ 자료입력 테이블 렌더링
function renderDataInputTable() {
    const tbody = document.getElementById('dataInputTable');
    if (!tbody) return;

    tbody.innerHTML = currentProject.data.map((row, index) => `
        <tr class="hover:bg-slate-50">
            <td class="border px-3 py-2 text-center">${row.순번}</td>
            <td class="border px-2 py-1">
                <input type="text" value="${row.이름 || ''}" 
                    onchange="updateCellAndRefresh('${row.id}', '이름', this.value)"
                    class="w-full border-none focus:ring-2 focus:ring-blue-500 rounded text-sm px-2 py-1">
            </td>
            <td class="border px-2 py-1">
                <input type="text" value="${row.연락처 || ''}"
                    onchange="updateCellAndRefresh('${row.id}', '연락처', this.value)"
                    class="w-full border-none focus:ring-2 focus:ring-blue-500 rounded text-sm px-2 py-1">
            </td>
            <td class="border px-2 py-1">
                <input type="text" value="${row.주소 || ''}"
                    onchange="updateCellAndRefresh('${row.id}', '주소', this.value)"
                    class="w-full border-none focus:ring-2 focus:ring-blue-500 rounded text-sm px-2 py-1">
            </td>
        </tr>
    `).join('');
}

// ✅ 보고서 테이블 렌더링
function renderReportTable() {
    const tbody = document.getElementById('reportTable');
    if (!tbody) return;

    tbody.innerHTML = currentProject.data
        .filter(r => r.이름 || r.연락처 || r.주소)
        .map(row => {
            const 본번 = row.본번 ? String(row.본번).padStart(4, '0') : '-';
            const 부번 = row.부번 ? String(row.부번).padStart(4, '0') : '-';
            return `
                <tr class="hover:bg-slate-50">
                    <td class="border px-2 py-2 text-center">${row.순번}</td>
                    <td class="border px-2 py-2">${row.이름 || '-'}</td>
                    <td class="border px-2 py-2">${row.연락처 || '-'}</td>
                    <td class="border px-2 py-2">${row.주소 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${row.우편번호 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${row.상태 || '예정'}</td>
                    <td class="border px-2 py-2 text-center">${row.법정동코드 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${row.pnu코드 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${row.대장구분 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${본번}</td>
                    <td class="border px-2 py-2 text-center">${부번}</td>
                    <td class="border px-2 py-2 text-center">${row.지목 || '-'}</td>
                    <td class="border px-2 py-2 text-center">${row.면적 || '-'}</td>
                    <td class="border px-2 py-2">${row.기록사항 || '-'}</td>
                </tr>
            `;
        }).join('');
}

// ✅ 셀 업데이트 후 리렌더링
function updateCellAndRefresh(rowId, field, value) {
    const row = currentProject.data.find(r => r.id === rowId);
    if (row) {
        row[field] = value;
        renderDataInputTable();
        renderReportTable();
    }
    localStorage.setItem('projects', JSON.stringify(projects));
}

// ✅ 지도 주소 개수 표시
function updateMapCount() {
    const mapCount = document.getElementById('mapAddressCount');
    if (!mapCount) return;
    const count = currentProject.data.filter(r => r.주소).length;
    mapCount.textContent = `이 ${count}개의 주소`;
}

// ✅ 토지정보 수집
async function fetchLandInfoForReport() {
    if (!currentProject) return;

    const rows = currentProject.data.filter(r => r.주소 && r.주소.trim() !== '');
    if (rows.length === 0) return;

    const loading = document.createElement('div');
    loading.id = 'landInfoLoading';
    loading.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-5 py-2 rounded shadow';
    loading.textContent = '토지정보 수집 중...';
    document.body.appendChild(loading);

    let success = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            const info = await getAddressDetailInfo(row.주소);
            if (info) {
                row.우편번호 = info.zipCode || '';
                row.법정동코드 = info.bjdCode || '';
                row.pnu코드 = info.pnuCode || '';
                row.대장구분 = info.ledgerType || '';
                row.본번 = info.mainLot || '';
                row.부번 = info.subLot || '';
                row.지목 = info.jimok || '';
                row.면적 = info.area || '';
                row.lat = info.lat || '';
                row.lng = info.lon || '';
                success++;
            }
        } catch (err) {
            console.warn('토지정보 수집 실패:', err);
        }
        loading.textContent = `토지정보 수집 중... (${i + 1}/${rows.length})`;
        await new Promise(r => setTimeout(r, 800));
    }

    document.body.removeChild(loading);
    renderReportTable();
    localStorage.setItem('projects', JSON.stringify(projects));

    alert(`토지정보 수집 완료: ${success}건`);
}

// ✅ 엑셀 다운로드 (제목줄 포함)
function downloadExcel() {
    if (!currentProject || currentProject.data.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }

    const headers = [
        '순번','이름','연락처','주소','우편번호','상태',
        '법정동코드','PNU코드','대장구분','본번','부번','지목','면적','기록사항'
    ];

    const data = currentProject.data.map(r => [
        r.순번 || '',
        r.이름 || '',
        r.연락처 || '',
        r.주소 || '',
        r.우편번호 || '',
        r.상태 || '',
        r.법정동코드 || '',
        r.pnu코드 || '',
        r.대장구분 || '',
        r.본번 || '',
        r.부번 || '',
        r.지목 || '',
        r.면적 || '',
        r.기록사항 || ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, "보고서");

    const fileName = `${currentProject.projectName}_보고서_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
