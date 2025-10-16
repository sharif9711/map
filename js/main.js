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

// js/main.js 파일 맨 아래에 추가
function refreshMap() {
    if (!currentProject || !currentProject.data) {
        console.log('새로고침할 프로젝트 데이터가 없습니다.');
        return;
    }
    const mapType = currentProject.mapType || 'kakao';
    console.log(`지도 새로고침 시작. 타입: ${mapType}`);
    if (mapType === 'vworld') {
        displayProjectOnVWorldMap(currentProject.data);
    } else {
        displayProjectOnKakaoMap(currentProject.data);
    }
}
