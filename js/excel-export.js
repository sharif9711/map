function downloadExcelXLSX() {
  if (!currentProject) return alert("프로젝트가 선택되지 않았습니다.");

  const rows = currentProject.data.filter(r => r.이름 || r.주소);
  if (rows.length === 0) return alert("다운로드할 데이터가 없습니다.");

  const headers = [
    "순번","이름","연락처","주소","우편번호","법정동코드","PNU코드","지목","면적"
  ];

  const data = [headers, ...rows.map(r => [
    r.순번 || "",
    r.이름 || "",
    r.연락처 || "",
    r.주소 || "",
    r.우편번호 || "",
    r.법정동코드 || "",
    r.pnu코드 || "",
    r.지목 || "",
    r.면적 || ""
  ])];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "보고서");

  const fileName = `${currentProject.projectName}_보고서_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
