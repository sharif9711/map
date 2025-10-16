// 데이터 관리
let projects = [];
let currentProject = null;
let selectedProjectId = null;

// 500행 초기 데이터 생성
function createInitialData() {
    const initialData = [];
    for (let i = 0; i < 1500; i++) {
        initialData.push({
            id: Date.now() + '_' + i,
            순번: i + 1,
            이름: '',
            연락처: '',
            주소: '',
            우편번호: '',
            lat: null,
            lng: null,
            상태: '예정',
            법정동코드: '',
            pnu코드: '',
            대장구분: '',
            본번: '',
            부번: '',
            지목: '',
            면적: '',
            기록사항: '',
            메모: []
        });
    }
    return initialData;
}

// 프로젝트 생성
function createProjectData(name, mapType) {
    return {
        id: Date.now().toString(),
        projectName: name,
        mapType: mapType || 'kakao', // 'kakao' 또는 'vworld'
        createdAt: new Date(),
        data: createInitialData()
    };
}

// 셀 업데이트
function updateCell(rowId, field, value) {
    const row = currentProject.data.find(r => r.id === rowId);
    if (row) {
        row[field] = value;
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);
        if (projectIndex !== -1) {
            projects[projectIndex] = currentProject;
        }
        return true;
    }
    return false;
}

// 붙여넣기 처리
function processPasteData(pastedText, rowIndex, field) {
    const rows = pastedText.split('\n').filter(row => row.trim() !== '');
    const fields = ['이름', '연락처', '주소'];
    const startFieldIndex = fields.indexOf(field);
    
    rows.forEach((row, i) => {
        const targetIndex = rowIndex + i;
        if (targetIndex < currentProject.data.length) {
            const cells = row.split('\t');
            const targetRow = currentProject.data[targetIndex];
            
            cells.forEach((cell, cellIndex) => {
                const targetField = fields[startFieldIndex + cellIndex];
                if (targetField) {
                    targetRow[targetField] = cell.trim();
                }
            });
        }
    });

    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
}

// 날짜 포맷
function formatDate(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

// 프로젝트 삭제
function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    if (confirm(`"${project.projectName}" 프로젝트를 삭제하시겠습니까?\n\n삭제된 프로젝트는 복구할 수 없습니다.`)) {
        projects = projects.filter(p => p.id !== projectId);
        renderProjects();
    }
}
