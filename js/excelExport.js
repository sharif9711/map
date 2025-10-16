// excelExport.js

function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    // ✅ 실제 입력된 행만 필터링
    const filteredData = currentProject.data.filter(row =>
        (row.이름 && row.이름.trim() !== '') ||
        (row.주소 && row.주소.trim() !== '') ||
        (row.연락처 && row.연락처.trim() !== '')
    );

    if (filteredData.length === 0) {
        showToast('📭 다운로드할 데이터가 없습니다.');
        return;
    }

    // ✅ id 제외 및 본번·부번 4자리 포맷
    const formattedData = filteredData.map(row => {
        const pad4 = (v) => {
            if (v === null || v === undefined || v === '') return '';
            const num = String(v).replace(/[^0-9]/g, '');
            return num.padStart(4, '0');
        };

        // id를 제외하고 새로운 객체 구성
        const { id, ...rest } = row;

        return {
            ...rest,
            본번: pad4(row.본번),
            부번: pad4(row.부번)
        };
    });

    // ✅ 엑셀 시트 생성
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // ✅ 자동 열 너비 조정
    const colWidths = Object.keys(formattedData[0]).map(key => ({
        wch: Math.max(
            key.length,
            ...formattedData.map(r => (r[key] ? r[key].toString().length : 0))
        ) + 2
    }));
    worksheet['!cols'] = colWidths;

    // ✅ workbook 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    // ✅ 파일명: 프로젝트명 + 날짜
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${currentProject.projectName || 'project'}_report_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);

    showToast(`📄 ${formattedData.length}건의 데이터가 엑셀로 다운로드되었습니다.`);
}
