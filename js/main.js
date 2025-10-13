let currentProject = null;

window.onload = () => {
  renderProjects();
};

function renderProjects() {
  const container = document.getElementById("projectListScreen");
  if (!projects.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen text-center">
        <h2 class="text-xl font-semibold text-slate-700 mb-4">아직 프로젝트가 없습니다.</h2>
        <button onclick="openCreateModal()" class="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ 새 프로젝트 만들기</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">프로젝트 목록</h2>
          <button onclick="openCreateModal()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ 새 프로젝트</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${projects.map(p => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-4 cursor-pointer"
              onclick="showProjectDetail('${p.id}')">
              <h3 class="text-lg font-semibold">${p.projectName}</h3>
              <p class="text-sm text-slate-500 mt-1">${p.mapType === 'vworld' ? 'VWorld' : '카카오맵'}</p>
              <p class="text-xs text-slate-400 mt-2">${new Date(p.createdAt).toLocaleString()}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
}
