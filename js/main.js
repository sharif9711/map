// 메인 초기화 및 실행

document.addEventListener('DOMContentLoaded', function() {
    // HTML 컴포넌트 삽입
    document.getElementById('projectListScreen').innerHTML = getProjectListHTML();
    document.getElementById('projectDetailScreen').innerHTML = getProjectDetailHTML();
    document.getElementById('createModal').innerHTML = getCreateModalHTML();
    
    // 초기 렌더링
    renderProjects();
});

document.addEventListener('DOMContentLoaded', function() {
    createProgressAndToastUI(); // ✅ 진행바/토스트 생성
});
