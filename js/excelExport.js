// ✅ excelExport.js
// 자료입력된 행만 내보내고, 본번/부번을 4자리로 맞춤

function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    // ✅ 주소가 입력된 행만 필터링
    const filledRows = currentProject.data.filter(row => row.주소 && row.주소.trim() !== '');

    if (filledRows.length === 0) {
        showToast('📭 엑셀로 내보낼 데이터가 없습니다.');
        return;
    }

    // ✅ 본번, 부번을 4자리로 변환
    const format4Digit = (value) => {
        if (!value || isNaN(value)) return '0000';
        return value.toString().padStart(4, '0');
    };

    // ✅ 출력 데이터 구성
    const formattedData = filledRows.map(row => ({
        순번: row.순번,
        이름: row.이름 || '',
        연락처: row.연락처 || '',
        주소: row.주소 || '',
        우편번호: row.우편번호 || '',
        상태: row.상태 || '',
        법정동코드: row.법정동코드 || '',
        PNU코드: row.pnu코드 || '',
        대장구분: row.대장구분 || '',
        본번: format4Digit(row.본번),
        부번: format4Digit(row.부번),
        지목: row.지목 || '',
        면적: row.면적 || '',
        기록사항: row.기록사항 || '',
        메모: (row.메모 && row.메모.length > 0)
            ? row.메모.map(m => `${m.내용} (${m.시간})`).join(' / ')
            : ''
    }));

    // ✅ 워크시트 & 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    // ✅ 파일 이름: 프로젝트명_report.xlsx
    const filename = `${currentProject.projectName || 'project'}_report.xlsx`;
    XLSX.writeFile(workbook, filename);

    // ✅ 알림
    showToast(`📄 ${filledRows.length}건의 데이터가 엑셀로 다운로드되었습니다.`);
}
