// js/excelExport.js 파일 전체를 이렇게 수정하세요:

// 엑셀 다운로드 기능 (개선 버전)

function downloadExcel() {
    if (!currentProject || !currentProject.data) {
        showToast('⚠️ 프로젝트 데이터가 없습니다.');
        return;
    }

    // 실제 데이터가 입력된 행만 필터링 (이름, 연락처, 주소 중 하나라도 있으면)
    const filteredData = currentProject.data.filter(row => 
        row.이름 || row.연락처 || row.주소
    );

    if (filteredData.length === 0) {
        showToast('⚠️ 다운로드할 데이터가 없습니다.');
        return;
    }

    // id 필드 제거하고 엑셀용 데이터 생성
    const excelData = filteredData.map(row => {
        const { id, vworld_lon, vworld_lat, ...rowWithoutId } = row; // id와 내부 좌표 제거
        
        // ✅ 본번과 부번을 4자리 문자열로 포맷팅
        if (rowWithoutId.본번) {
            rowWithoutId.본번 = String(rowWithoutId.본번).padStart(4, '0');
        }
        if (rowWithoutId.부번) {
            rowWithoutId.부번 = String(rowWithoutId.부번).padStart(4, '0');
        }
        
        // 메모 배열을 문자열로 변환
        if (rowWithoutId.메모 && Array.isArray(rowWithoutId.메모)) {
            rowWithoutId.메모 = rowWithoutId.메모
                .map((m, i) => `${i + 1}. ${m.내용} (${m.시간})`)
                .join('\n');
        }
        
        return rowWithoutId;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    const filename = `${currentProject.projectName || 'project'}_report.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`📄 ${excelData.length}개 행이 다운로드되었습니다.`);
}
