function showProjectDetail(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  currentProject = project;

  document.getElementById("projectListScreen").classList.remove("active");
  document.getElementById("projectDetailScreen").classList.add("active");

  renderProjectDetailHeader(project);
  renderTabs();
  switchTab("자료입력");
}

function renderProjectDetailHeader(project) {
  document.getElementById("projectDetailScreen").innerHTML = `
    <div class="p-4 border-b bg-white shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button onclick="backToList()" class="text-slate-600 hover:text-slate-900">
          ←
        </button>
        <h2 class="text-lg font-semibold">${project.projectName}</h2>
      </div>
      <button id="mapViewButton" onclick="switchTab('지도')" class="px-3 py-2 rounded bg-blue-600 text-white text-sm">지도 보기</button>
    </div>

    <div class="flex justify-around bg-white border-b">
      ${["자료입력", "보고서", "연결", "지도"].map(tab => `
        <button id="tab-${tab}" onclick="switchTab('${tab}')" 
          class="py-3 flex-1 text-sm text-slate-600 hover:text-blue-600">${tab}</button>
      `).join("")}
    </div>

    <div id="content-자료입력" class="p-4"></div>
    <div id="content-보고서" class="p-4 hidden">
      <div id="progressContainer" class="w-full bg-gray-200 rounded-full h-3 mt-3 hidden">
        <div id="progressBar" class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <p id="progressText" class="text-sm text-gray-600 mt-2"></p>

      <div class="flex justify-between items-center my-3">
        <button id="collectLandInfoBtn" onclick="autoCollectLandInfo()" class="px-4 py-2 rounded bg-blue-600 text-white text-sm">토지정보 수집</button>
        <button id="excelDownloadBtn" onclick="downloadExcelXLSX()" class="px-4 py-2 rounded bg-green-600 text-white text-sm">엑셀 다운로드</button>
      </div>

      <table id="reportTable" class="min-w-full border border-slate-300 text-sm bg-white mt-3">
        <thead class="bg-slate-100">
          <tr>
            <th class="border px-2 py-1">순번</th>
            <th class="border px-2 py-1">이름</th>
            <th class="border px-2 py-1">연락처</th>
            <th class="border px-2 py-1 address-cell">주소</th>
            <th class="border px-2 py-1">우편번호</th>
            <th class="border px-2 py-1">법정동코드</th>
            <th class="border px-2 py-1">PNU코드</th>
            <th class="border px-2 py-1">지목</th>
            <th class="border px-2 py-1">면적</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div id="content-연결" class="p-4 hidden">연결 메뉴 (준비 중)</div>
    <div id="content-지도" class="p-4 hidden"><div id="map" class="w-full h-[500px]"></div></div>
  `;
}

function switchTab(tabName) {
  const tabs = ["자료입력", "보고서", "연결", "지도"];
  tabs.forEach(tab => {
    const btn = document.getElementById(`tab-${tab}`);
    const content = document.getElementById(`content-${tab}`);
    if (tab === tabName) {
      btn.classList.add("text-blue-600", "border-b-2", "border-blue-600");
      content.classList.remove("hidden");
      if (tab === "보고서") autoCollectLandInfo();
    } else {
      btn.classList.remove("text-blue-600", "border-b-2", "border-blue-600");
      content.classList.add("hidden");
    }
  });
}

function backToList() {
  document.getElementById("projectDetailScreen").classList.remove("active");
  document.getElementById("projectListScreen").classList.add("active");
  currentProject = null;
}
