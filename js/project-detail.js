// ================================
// ✅ project-detail.js
// 지도 프로젝트 상세 화면 기능
// ================================

// 전역 변수
let currentProject = null;
let projectData = [];
let gridInstance = null;

// ================================
// ✅ 프로젝트 데이터 불러오기
// ================================
async function loadProjectDetail(projectId) {
    try {
        const { data, error } = await supabase
            .from('project-detail')
            .select('*')
            .eq('project_id', projectId)
            .order('id', { ascending: true });

        if (error) throw error;
        projectData = data || [];
        renderProjectTable(projectData);
        console.log(`✅ ${projectData.length}행 불러옴`);
    } catch (err) {
        console.error('❌ 프로젝트 상세 불러오기 실패:', err);
        showToast('프로젝트 데이터를 불러오지 못했습니다.');
    }
}

// ================================
// ✅ 보고서 테이블(Grid) 렌더링
// ================================
function renderProjectTable(data) {
    const table = document.getElementById('reportTableBody');
    table.innerHTML = '';

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="10" style="text-align:center;">데이터가 없습니다.</td></tr>`;
        return;
    }

    // 실제 데이터 행 수만큼만 표시 (기존 1500행 제거)
    const rowCount = data.length;
    for (let i = 0; i < rowCount; i++) {
        const row = data[i];
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${row.이름 || ''}</td>
            <td>${row.주소 || ''}</td>
            <td>${pad4(row.본번)}</td>
            <td>${pad4(row.부번)}</td>
            <td>${row.지목 || ''}</td>
            <td>${row.면적 || ''}</td>
            <td>${row.상태 || ''}</td>
            <td>${row.메모 || ''}</td>
        `;

        table.appendChild(tr);
    }
}

// ================================
// ✅ 숫자를 4자리 문자열로 변환 (예: 1 → 0001)
// ================================
function pad4(value) {
    if (value === null || value === undefined || value === '') return '';
    const str = value.toString();
    return str.padStart(4, '0');
}

// ================================
// ✅ 엑셀 다운로드 기능 (보고서)
// ================================
function downloadExcel() {
    if (!projectData || projectData.length === 0) {
        showToast('⚠️ 다운로드할 데이터가 없습니다.');
        return;
    }

    const worksheetData = projectData.map((row, idx) => ({
        순번: idx + 1,
        이름: row.이름 || '',
        주소: row.주소 || '',
        본번: pad4(row.본번),
        부번: pad4(row.부번),
        지목: row.지목 || '',
        면적: row.면적 || '',
        상태: row.상태 || '',
        메모: row.메모 || '',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '보고서');
    XLSX.writeFile(wb, `토지_보고서_${new Date().toISOString().slice(0, 10)}.xlsx`);
    console.log('✅ 엑셀 다운로드 완료');
}

// ================================
// ✅ UI 이벤트 연결
// ================================
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('btnExcelDownload');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadExcel);
    }

    // 프로젝트 선택 후 불러오기
    const projectId = localStorage.getItem('selectedProjectId');
    if (projectId) loadProjectDetail(projectId);
});

// ================================
// ✅ 유틸리티 함수
// ================================
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => (toast.style.display = 'none'), 2500);
}
