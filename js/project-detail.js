// ===============================
// project-detail.js (v3.9.3 완성본)
// ===============================
console.log("✅ js/project-detail.js loaded successfully.");

// ===============================
// 프로젝트 상세 화면 전환
// ===============================
function showProjectDetail() {
    document.getElementById('projectListScreen').classList.remove('active');
    document.getElementById('projectDetailScreen').classList.add('active');
    document.getElementById('currentProjectName').textContent = currentProject.projectName;

    switchTab('자료입력');
    renderDataInputTable();
    renderReportTable();
}

function backToList() {
    document.getElementById('projectDetailScreen').classList.remove('active');
    document.getElementById('projectListScreen').classList.add('active');
    currentProject = null;
}

// ===============================
// 엑셀형 자료입력 테이블 렌더링
// ===============================
function renderDataInputTable() {
    const tbody = document.getElementById('dataInputTable');
    if (!tbody || !currentProject) return;

    tbody.innerHTML = currentProject.data.map((row, index) => `
        <tr class="hover:bg-slate-50">
            <td class="border border-slate-300 px-2 py-1 text-center text-xs text-slate-700">${row.순번}</td>
            <td class="border border-slate-300 px-1">
                <input type="text" value="${row.이름 || ''}"
                    onchange="updateCellAndRefresh('${row.id}', '이름', this.value)"
                    onpaste="handlePaste(event, ${index})"
                    class="w-full px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            </td>
            <td class="border border-slate-300 px-1">
                <input type="text" value="${row.연락처 || ''}"
                    onchange="updateCellAndRefresh('${row.id}', '연락처', this.value)"
                    class="w-full px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            </td>
            <td class="border border-slate-300 px-1">
                <input type="text" value="${row.주소 || ''}"
                    onchange="updateCellAndRefresh('${row.id}', '주소', this.value)"
                    class="w-full px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            </td>
        </tr>
    `).join('');
}

// 셀 값 변경 시 데이터 반영
function updateCellAndRefresh(id, field, value) {
    const row = currentProject.data.find(r => r.id === id);
    if (row) row[field] = value;
}

// 붙여넣기 처리
function handlePaste(event, rowIndex) {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text');
    const lines = text.trim().split('\n').map(line => line.split('\t'));

    for (let i = 0; i < lines.length; i++) {
        const row = currentProject.data[rowIndex + i];
        if (!row) continue;
        const cols = lines[i];
        row.이름 = cols[0] || row.이름;
        row.연락처 = cols[1] || row.연락처;
        row.주소 = cols[2] || row.주소;
    }

    renderDataInputTable();
}

// ===============================
// 탭 전환 (보고서 탭 자동 실행 수정)
// ===============================
function switchTab(tabName) {
    const tabs = ['자료입력', '보고서', '지도', '연결'];
    tabs.forEach(tab => {
        const tabBtn = document.getElementById('tab-' + tab);
        const content = document.getElementById('content-' + tab);

        if (tabBtn && content) {
            if (tab === tabName) {
                tabBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                content.style.display = 'block';
                if (tab === '보고서') fetchLandInfoForReport(true);
            } else {
                tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                content.style.display = 'none';
            }
        }
    });
}

// ===============================
// PNU 없는 행만 토지정보 수집
// ===============================
async function fetchLandInfoForReport(autoMode = false) {
    if (!currentProject) return;

    const rows = currentProject.data.filter(row =>
        row.주소 && row.주소.trim() !== '' &&
        (!row.pnu코드 || row.pnu코드.trim() === '')
    );

    if (rows.length === 0) {
        if (!autoMode) showTopNotice("📭 이미 모든 행에 PNU 코드가 있습니다.", "info");
        return;
    }

    let progressBar = document.getElementById('progressBar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'progressBar';
        progressBar.style.cssText = `
            position: fixed; top: 0; left: 0; height: 4px; 
            background-color: #3b82f6; width: 0%; z-index: 9999; 
            transition: width 0.3s ease;
        `;
        document.body.appendChild(progressBar);
    }

    showTopNotice(`🔍 ${rows.length}건의 PNU코드를 조회 중...`, "info");

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            const detailInfo = await getAddressDetailInfo(row.주소);
            if (detailInfo) {
                row.법정동코드 = detailInfo.법정동코드 || row.법정동코드;
                row.pnu코드 = detailInfo.pnuCode || row.pnu코드;
                row.대장구분 = detailInfo.대장구분 || row.대장구분;
                row.본번 = detailInfo.본번 || row.본번;
                row.부번 = detailInfo.부번 || row.부번;
                row.지목 = detailInfo.지목 || row.지목;
                row.면적 = detailInfo.면적 || row.면적;
            }
        } catch (e) {
            console.error(`❌ [${i+1}] ${row.주소}`, e);
        }

        progressBar.style.width = `${((i + 1) / rows.length) * 100}%`;
        await new Promise(r => setTimeout(r, 400));
    }

    const idx = projects.findIndex(p => p.id === currentProject.id);
    if (idx !== -1) projects[idx] = currentProject;
    renderReportTable();

    progressBar.style.width = '100%';
    showTopNotice(`✅ ${rows.length}건 토지정보 갱신 완료`, "success");
    setTimeout(() => (progressBar.style.width = '0%'), 1500);
}

// ===============================
// 보고서 테이블 렌더링
// ===============================
function renderReportTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    if (!currentProject || !currentProject.data) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-slate-500 py-4">데이터가 없습니다.</td></tr>`;
        return;
    }

    const rows = currentProject.data;
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-slate-500 py-4">데이터가 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((row, idx) => `
        <tr class="hover:bg-slate-50 text-xs text-slate-700">
            <td class="border border-slate-300 px-2 py-1 text-center">${row.순번 || idx + 1}</td>
            <td class="border border-slate-300 px-2 py-1">${row.이름 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.연락처 || ''}</td>
            <td class="border border-slate-300 px-2 py-1">${row.주소 || ''}</td>
            <td class="border border-slate-300 px-2 py-1 text-center">${row.법정동코드 || '-'}</td>
            <td class="border border-slate-300 px-2 py-1 text-center">${row.pnu코드 || '-'}</td>
            <td class="border border-slate-300 px-2 py-1 text-center">${row.본번 || '-'}</td>
            <td class="border border-slate-300 px-2 py-1 text-center">${row.부번 || '-'}</td>
            <td class="border border-slate-300 px-2 py-1 text-center">${row.지목 || '-'}</td>
            <td class="border border-slate-300 px-2 py-1 text-right">${row.면적 || '-'}</td>
        </tr>
    `).join('');
}

// ===============================
// 상단 Toast 알림
// ===============================
function showTopNotice(message, type = 'info') {
    const exist = document.getElementById('topNotice');
    if (exist) exist.remove();
    const colorMap = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    const box = document.createElement('div');
    box.id = 'topNotice';
    box.textContent = message;
    box.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        background: ${colorMap[type]}; color: #fff; padding: 10px 20px; 
        border-radius: 8px; font-weight: 500; z-index: 9999; 
        box-shadow: 0 3px 10px rgba(0,0,0,0.2); opacity: 1; 
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(box);
    setTimeout(() => (box.style.opacity = '0'), 3000);
    setTimeout(() => box.remove(), 3500);
}

// ===============================
// XLSX 다운로드 (CSV → Excel)
// ===============================
function downloadExcel() {
    if (!currentProject) return;
    const rows = currentProject.data;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '보고서');
    const fileName = `${currentProject.projectName}_보고서.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showTopNotice(`📄 ${fileName} 다운로드 완료`, "success");
}

// ===============================
// VWorld API 상세조회 함수
// ===============================
async function getAddressDetailInfo(address) {
    if (!address || address.trim() === "") return null;

    const point = await getVWorldCoord(address);
    if (!point) return null;
    const pnu = await getVWorldPNU(point.x, point.y);
    if (!pnu) return null;
    const landInfo = await getVWorldLandCharacteristics(pnu);
    const zipCode = await getKakaoPostalCode(address);

    const daejangMap = { "1": "토지", "2": "임야", "3": "하천", "4": "간척" };
    const daejang = daejangMap[pnu.charAt(10)] || "기타";
    const bjdCode = pnu.substring(0, 10);

    return {
        pnuCode: pnu,
        법정동코드: bjdCode,
        대장구분: daejang,
        본번: pnu.substring(11, 15).replace(/^0+/, "") || "0",
        부번: pnu.substring(15, 19).replace(/^0+/, "") || "0",
        지목: landInfo?.lndcgrCodeNm || "-",
        면적: landInfo?.lndpclAr || "-",
        zipCode: zipCode || "-",
        lat: point.y,
        lon: point.x
    };
}
