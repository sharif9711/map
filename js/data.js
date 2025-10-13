// js/data.js
// 🔹 프로젝트 데이터 저장 및 로드 담당

let projects = [];

// ✅ 로컬스토리지에서 프로젝트 불러오기
function loadProjects() {
  try {
    const saved = localStorage.getItem("projects");
    if (saved) {
      projects = JSON.parse(saved);
    } else {
      projects = [];
    }
  } catch (error) {
    console.error("⚠️ 프로젝트 불러오기 실패:", error);
    projects = [];
  }
}

// ✅ 로컬스토리지에 프로젝트 저장하기
function saveProjects() {
  try {
    localStorage.setItem("projects", JSON.stringify(projects));
  } catch (error) {
    console.error("⚠️ 프로젝트 저장 실패:", error);
  }
}

// ✅ 새 프로젝트 추가
function addProject(project) {
  projects.push(project);
  saveProjects();
}

// ✅ 특정 프로젝트 가져오기
function getProjectById(id) {
  return projects.find((p) => p.id === id);
}

// ✅ 프로젝트 삭제
function deleteProject(id) {
  projects = projects.filter((p) => p.id !== id);
  saveProjects();
}
