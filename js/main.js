document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ 페이지 로드 완료');

    // 프로젝트 목록 로드
    loadProjects();
    renderProjects();

    // 새 프로젝트 버튼 이벤트
    const createBtn = document.querySelector('button[onclick="openCreateModal()"]');
    if (createBtn) {
        createBtn.addEventListener('click', openCreateModal);
    }

    // mapViewButton은 projectDetail 화면 전환 후 갱신됨
    const mapBtn = document.getElementById('mapViewButton');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            const mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) return;

            // 지도 영역 표시
            mapContainer.classList.toggle('hidden');
            if (!mapContainer.classList.contains('hidden')) {
                if (currentProject.mapType === 'vworld') initVWorldMap('mapContainer');
                else initKakaoMap('mapContainer');
            }
        });
    }

    console.log('📦 프로젝트 렌더링 완료');
});
