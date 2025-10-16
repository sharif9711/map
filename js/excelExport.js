function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    const worksheet = XLSX.utils.json_to_sheet(currentProject.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    const filename = `${currentProject.projectName || 'project'}_report.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast('📄 엑셀 파일이 다운로드되었습니다.');
}
