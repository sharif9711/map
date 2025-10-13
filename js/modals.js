// ✅ 새 프로젝트 생성 모달 (비밀번호 제거 + 지도종류 선택)
function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div class="bg-white rounded-2xl shadow-xl p-6 w-96">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">새 프로젝트 만들기</h2>

                <div class="space-y-5">
                    <!-- 프로젝트 이름 -->
                    <div>
                        <label class="block text-sm text-slate-700 mb-1">프로젝트 이름</label>
                        <input id="newProjectName" type="text"
                            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="예: 2025년도 지적조사">
                    </div>

                    <!-- 지도 선택 -->
                    <div>
                        <label class="block text-sm text-slate-700 mb-2">지도 종류</label>
                        <div class="flex justify-between gap-3">
                            <button id="btnKakao" type="button"
                                class="flex-1 px-3 py-2 rounded-lg font-medium bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition">
                                카카오맵
                            </button>
                            <button id="btnVWorld" type="button"
                                class="flex-1 px-3 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition">
                                VWorld
                            </button>
                        </div>
                        <input type="hidden" id="selectedMapType" value="kakao">
                    </div>
                </div>

                <!-- 하단 버튼 -->
                <div class="flex justify-end gap-3 mt-6">
                    <button id="cancelBtn"
                        class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">취소</button>
                    <button id="createBtn"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">생성</button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // 요소 참조
    const kakaoBtn = modal.querySelector('#btnKakao');
    const vworldBtn = modal.querySelector('#btnVWorld');
    const mapTypeInput = modal.querySelector('#selectedMapType');
    const createBtn = modal.querySelector('#createBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const nameInput = modal.querySelector('#newProjectName');

    // 지도 선택 버튼 토글
    kakaoBtn.addEventListener('click', () => {
        mapTypeInput.value = 'kakao';
        kakaoBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        kakaoBtn.classList.remove('bg-slate-100', 'text-slate-700');
        vworldBtn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
        vworldBtn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300');
    });

    vworldBtn.addEventListener('click', () => {
        mapTypeInput.value = 'vworld';
        vworldBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        vworldBtn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-300');
        kakaoBtn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
        kakaoBtn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-300');
    });

    // 취소 버튼
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 생성 버튼
    createBtn.addEventListener('click', () => {
        const projectName = nameInput.value.trim();
        const mapType = mapTypeInput.value;

        if (!projectName) {
            alert('프로젝트 이름을 입력해주세요.');
            return;
        }

        // 새 프로젝트 생성
        const newProject = {
            id: crypto.randomUUID(),
            projectName: projectName,
            createdAt: new Date(),
            mapType: mapType,
            data: []
        };

        // 로컬스토리지에 저장
        projects.unshift(newProject);
        localStorage.setItem('projects', JSON.stringify(projects));

        // 리스트 갱신 및 모달 닫기
        renderProjects();
        modal.style.display = 'none';
    });
}

// ✅ 모달 닫기 함수
function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none';
}
