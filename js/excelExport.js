// excelExport.js

function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    // ✅ 실제 입력된 행만 필터링 (이름 또는 주소가 비어있지 않은 행)
    const filteredData = currentProject.data.filter(row =>
        (row.이름 && row.이름.trim() !== '') ||
        (row.주소 && row.주소.trim() !== '')
    );

    if (filteredData.length === 0) {
        showToast('📭 저장할 데이터가 없습니다.');
        return;
    }

    // ✅ 본번·부번을 4자리로 포맷
    const formattedData = filteredData.map(row => {
        const pad4 = (v) => {
            if (v === null || v === undefined || v === '') return '';
            const num = String(v).replace(/[^0-9]/g, ''); // 숫자만 추출
            return num.padStart(4, '0');
        };
        return {
            ...row,
            본번: pad4(row.본번),
            부번: pad4(row.부번),
        };
    });

    // ✅ 엑셀 시트 생성
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    // ✅ 파일명: 프로젝트명 + 날짜
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${currentProject.projectName || 'project'}_report_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);

    showToast(`📄 ${formattedData.length}건의 데이터가 엑셀로 다운로드되었습니다.`);
}
