// main.js - 애플리케이션 진입점

console.log("✅ js/main.js loaded successfully.");

// 애플리케이션 초기화 함수
function initApp() {
    // ✅ 앱이 이미 초기화되었는지 확인하여 중복 실행 방지
    if (window.isAppInitialized) {
        console.log('Application already initialized.');
        return;
    }
    window.isAppInitialized = true;

    console.log('🚀 Initializing application...');

    // 1. localStorage에서 프로젝트 목록 불러오기
    const savedProjects = localStorage.getItem('vworldProjects');
    if (savedProjects) {
        try {
            projects = JSON.parse(savedProjects);
            console.log(`✅ Loaded ${projects.length} projects from localStorage.`);
        } catch (e) {
            console.error('❌ Failed to parse projects from localStorage:', e);
            projects = []; // 파싱 실패 시 빈 배열로 초기화
        }
    } else {
        console.log('📄 No saved projects found. Starting fresh.');
        projects = []; // 저장된 프로젝트가 없으면 빈 배열로 초기화
    }

    // 2. UI 초기화 (진행바, 토스트 메시지)
    if (typeof createProgressAndToastUI === 'function') {
        createProgressAndToastUI();
    }

    // ✅ [수정] 3. 모달창의 내용을 미리 채워 넣습니다.
    const createModalContainer = document.getElementById('createModal');
    if (createModalContainer && typeof getCreateModalHTML === 'function') {
        createModalContainer.innerHTML = getCreateModalHTML();
        console.log('✅ Create modal content loaded.');
    } else {
        console.error('❌ Could not load create modal content.');
    }

    // 4. 초기 화면 렌더링 (프로젝트 목록)
    if (typeof renderProjects === 'function') {
        renderProjects();
    }
    
    // 5. URL 해시를 확인하여 특정 프로젝트가 있는지 확인 (선택적 기능)
    // 예: index.html#some-project-id
    const hash = window.location.hash.substring(1);
    if (hash) {
        const project = projects.find(p => p.id === hash);
        if (project) {
            console.log(`🔗 Opening project from URL hash: ${project.projectName}`);
            currentProject = project;
            if (typeof showProjectDetail === 'function') {
                showProjectDetail();
            }
        }
    }
}

// DOM이 완전히 로드된 후 앱 초기화 실행
// 이것이 가장 중요합니다. 모든 스크립트가 로드된 후에 initApp이 실행되도록 보장합니다.
document.addEventListener('DOMContentLoaded', initApp);
