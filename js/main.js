// js/main.js
// 🌐 메인 초기화 및 화면 렌더링 제어

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ main.js 로드 완료");

  // 프로젝트 불러오기
  if (typeof loadProjects === "function") {
    loadProjects();
  } else {
    console.error("❌ loadProjects 함수가 정의되지 않았습니다. data.js 순서 확인!");
  }

  // 프로젝트 렌더링
  if (typeof renderProjects === "function") {
    renderProjects();
  } else {
    console.error("❌ renderProjects 함수가 없습니다. project-list.js 확인!");
  }

  // 새 프로젝트 버튼 연결
  const createBtn = document.querySelector('button[onclick="openCreateModal()"]');
  if (createBtn) {
    createBtn.addEventListener("click", openCreateModal);
  }

  console.log("📦 초기화 완료 - 프로젝트 목록 렌더링 준비");
});


// ✅ 지도 초기화 함수 (프로젝트 상세 화면에서 사용)
function initSelectedMap(mapType) {
  const mapContainer = document.getElementById("mapContainer");
  if (!mapContainer) {
    console.warn("⚠️ mapContainer 요소를 찾을 수 없습니다.");
    return;
  }

  mapContainer.classList.remove("hidden");

  if (mapType === "vworld") {
    console.log("🌏 VWorld 지도 초기화 실행");
    initVWorldMap("mapContainer");
  } else {
    console.log("🗺️ Kakao 지도 초기화 실행");
    initKakaoMap("mapContainer");
  }
}


// ✅ 프로젝트 리스트 렌더링 트리거 함수 (프로젝트 생성 이후에도 사용됨)
function refreshProjectList() {
  if (typeof renderProjects === "function") {
    renderProjects();
  } else {
    console.error("❌ renderProjects 함수가 정의되지 않았습니다.");
  }
}
