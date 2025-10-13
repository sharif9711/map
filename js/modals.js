function openCreateModal() {
  const modal = document.getElementById("createModal");
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">새 프로젝트 만들기</h2>
        <label class="block text-sm font-medium text-slate-600 mb-1">프로젝트 이름</label>
        <input id="projectNameInput" type="text" class="w-full mb-4 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400" placeholder="예: 제3구역 현장조사">

        <label class="block text-sm font-medium text-slate-600 mb-2">지도 종류</label>
        <div class="flex justify-between mb-6">
          <button id="kakaoBtn" class="w-1/2 border border-blue-500 text-blue-600 font-medium rounded-l-lg py-2 bg-blue-50">카카오맵</button>
          <button id="vworldBtn" class="w-1/2 border border-blue-500 text-slate-600 font-medium rounded-r-lg py-2">VWorld</button>
        </div>

        <div class="flex justify-end gap-2">
          <button onclick="closeCreateModal()" class="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">취소</button>
          <button onclick="createProject()" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">생성</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");

  const kakaoBtn = document.getElementById("kakaoBtn");
  const vworldBtn = document.getElementById("vworldBtn");

  let selected = "kakao";
  kakaoBtn.onclick = () => {
    selected = "kakao";
    kakaoBtn.classList.add("bg-blue-50", "text-blue-600");
    vworldBtn.classList.remove("bg-blue-50", "text-blue-600");
  };
  vworldBtn.onclick = () => {
    selected = "vworld";
    vworldBtn.classList.add("bg-blue-50", "text-blue-600");
    kakaoBtn.classList.remove("bg-blue-50", "text-blue-600");
  };

  window.selectedMapType = selected;
}

function closeCreateModal() {
  document.getElementById("createModal").classList.remove("active");
  document.getElementById("createModal").innerHTML = "";
}

function createProject() {
  const name = document.getElementById("projectNameInput")?.value.trim();
  if (!name) return alert("프로젝트 이름을 입력하세요.");

  const mapType = window.selectedMapType || "kakao";
  const newProj = {
    id: crypto.randomUUID(),
    projectName: name,
    mapType,
    createdAt: new Date(),
    data: []
  };

  projects.unshift(newProj);
  saveProjects();
  closeCreateModal();
  renderProjects();
}
