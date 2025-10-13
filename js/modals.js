// 모달 관련 함수

function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.getElementById('projectName').value = '';
    document.getElementById('projectPassword').value = '';
    // 카카오맵을 기본값으로 체크
    document.getElementById('mapTypeKakao').checked = true;
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