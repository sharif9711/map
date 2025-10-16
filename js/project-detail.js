// project-detail.js 수정완성본
console.log("✅ js/project-detail.js loaded successfully.");

// ===============================
// 프로젝트 상세 화면 전환
// ===============================
function showProjectDetail() {
    document.getElementById('projectListScreen').classList.remove('active');
    document.getElementById('projectDetailScreen').classList.add('active');
    document.getElementById('currentProjectName').textContent = currentProject.projectName;

    const mapBtn = document.getElementById('mapViewButton');
    if (mapBtn) {
        const mapTypeText = currentProject.mapType === 'vworld' ? 'VWorld' : '카카오맵';
        mapBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

function backToList() {
    document.getElementById('projectDetailScreen').classList.remove('active');
    document.getElementById('projectListScreen').classList.add('active');
    currentProject = null;
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
                if (tab === '지도') onMapTabActivated();
                if (tab === '보고서') fetchLandInfoForReport(true); // ✅ 자동 시 PNU 없는 행만 조회
            } else {
                tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                content.style.display = 'none';
            }
        }
    });
}

// ===============================
// 보고서 탭 - PNU 없는 행만 조회
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

    // 진행 표시바 생성
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

    // 저장 및 렌더링
    const idx = projects.findIndex(p => p.id === currentProject.id);
    if (idx !== -1) projects[idx] = currentProject;
    if (typeof renderReportTable === 'function') renderReportTable();

    progressBar.style.width = '100%';
    showTopNotice(`✅ ${rows.length}건 토지정보 갱신 완료`, "success");
    setTimeout(() => (progressBar.style.width = '0%'), 1500);
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
// 기존 VWorld + Kakao 주소 조회 함수 유지
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
