// 모달 관련 함수

function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
    document.getElementById('projectName').value = '';
    // 카카오맵을 기본값으로 체크
    document.getElementById('mapTypeKakao').checked = true;
}

function createProject() {
    const name = document.getElementById('projectName').value;
    const mapType = document.querySelector('input[name="mapType"]:checked').value;

    if (!name) {
        alert('프로젝트 이름을 입력해주세요.');
        return;
    }

    const project = createProjectData(name, mapType);
    projects.unshift(project);
    closeCreateModal();
    renderProjects();
}

// 프로젝트를 비밀번호 없이 바로 여는 함수
function openProjectDirectly(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        currentProject = project;
        if (typeof showProjectDetail === 'function') {
            showProjectDetail();
        } else {
            console.error('showProjectDetail function is not defined');
            alert('프로젝트를 열 수 없습니다. 페이지를 새로고침해주세요.');
        }
    } else {
        alert('프로젝트를 찾을 수 없습니다.');
    }
}
