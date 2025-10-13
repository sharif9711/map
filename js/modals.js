// 모달 관련 함수

// ✅ 새 프로젝트 생성 모달 (프로젝트 이름 + 지도종류 선택)
function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div class="bg-white rounded-2xl shadow-xl p-6 w-96">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">새 프로젝트 만들기</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-slate-700 mb-1">프로젝트 이름</label>
                        <input id="newProjectName" type="text"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="예: 2025년도 지번조사">
                    </div>

                    <div>
                        <label class="block text-sm text-slate-700 mb-1">지도 종류</label>
                        <select id="newMapType"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="kakao" selected>카카오맵</option>
                            <option value="vworld">VWorld</option>
                        </select>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-6">
                    <button onclick="closeCreateModal()"
                        class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">취소</button>
                    <button onclick="createProject()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">생성</button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none';
}


function createProject() {
    const name = document.getElementById('projectName').value;
    const password = document.getElementById('projectPassword').value;
    const mapType = document.querySelector('input[name="mapType"]:checked').value;

    if (!name || !password) {
        alert('프로젝트 이름과 비밀번호를 입력해주세요.');
        return;
    }

    const project = createProjectData(name, password, mapType);
    projects.unshift(project);
    closeCreateModal();
    renderProjects();
}

function openPasswordModal(projectId) {
    selectedProjectId = projectId;
    const project = projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('passwordProjectName').textContent = project.projectName;
        document.getElementById('passwordModal').classList.add('active');
        setTimeout(() => {
            document.getElementById('enteredPassword').focus();
        }, 100);
    }
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    document.getElementById('enteredPassword').value = '';
    selectedProjectId = null;
}

function checkPassword() {
    const password = document.getElementById('enteredPassword').value;
    const project = projects.find(p => p.id === selectedProjectId);

    if (project && password === project.password) {
        currentProject = project;
        closePasswordModal();
        
        // showProjectDetail 함수가 정의되어 있는지 확인
        if (typeof showProjectDetail === 'function') {
            showProjectDetail();
        } else {
            console.error('showProjectDetail function is not defined');
            alert('프로젝트를 열 수 없습니다. 페이지를 새로고침해주세요.');
        }
    } else {
        alert('비밀번호가 올바르지 않습니다.');
        document.getElementById('enteredPassword').value = '';
    }
}
