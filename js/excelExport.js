// excelExport.js

function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    // ✅ 1️⃣ 주소가 입력된 행만 필터링
    const filledRows = currentProject.data.filter(row => row.주소 && row.주소.trim() !== '');

    if (filledRows.length === 0) {
        showToast('📭 엑셀로 내보낼 데이터가 없습니다.');
        return;
    }

    // ✅ 2️⃣ 본번, 부번을 4자리로 변환
    const formattedData = filledRows.map(row => {
        const format4Digit = (value) => {
            if (!value || isNaN(value)) return '0000';
            return value.toString().padStart(4, '0');
        };

        return {
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
        };
    });

    // ✅ 3️⃣ 시트 생성 및 엑셀 파일로 저장
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    const filename = `${currentProject.projectName || 'project'}_report.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`📄 ${filledRows.length}건의 엑셀 파일이 다운로드되었습니다.`);
}
