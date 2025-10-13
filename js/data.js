let projects = [];

function loadProjects() {
  const saved = localStorage.getItem("projects");
  projects = saved ? JSON.parse(saved) : [];
}

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

loadProjects();
