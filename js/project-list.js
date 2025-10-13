function renderProjects() {
    const emptyState = document.getElementById('emptyState');
    const projectsList = document.getElementById('projectsList');
    const projectsGrid = document.getElementById('projectsGrid');
    const projectCount = document.getElementById('projectCount');

    if (!emptyState || !projectsList || !projectsGrid || !projectCount) {
        console.error('Required elements not found');
        return;
    }

    if (projects.length === 0) {
        emptyState.style.display = 'flex';
        projectsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        projectsList.style.display = 'block';
        projectCount.textContent = projects.length;

        projectsGrid.innerHTML = projects.map(project => {
            const mapTypeBadge = project.mapType === 'vworld' 
                ? '<span class="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">VWorld</span>'
                : '<span class="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">카카오맵</span>';
            
            return `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group relative">
                <button onclick="deleteProject(event, '${project.id}')" class="absolute top-3 right-3 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10" title="프로젝트 삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
                <div onclick="openPasswordModal('${project.id}')" class="p-6 cursor-pointer">
                    <div class="flex items-start justify-between pb-3">
                        <div class="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                                <line x1="9" y1="3" x2="9" y2="18"></line>
                                <line x1="15" y1="6" x2="15" y2="21"></line>
                            </svg>
                        </div>
                        ${mapTypeBadge}
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-slate-900 line-clamp-1">${project.projectName}</h3>
                        <div class="space-y-2.5">
                            <div class="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>${formatDate(project.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }
}

function deleteProject(event, projectId) {
    event.stopPropagation();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    if (confirm(`"${project.projectName}" 프로젝트를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
        const index = projects.findIndex(p => p.id === projectId);
        if (index > -1) {
            projects.splice(index, 1);
        }
        renderProjects();
    }
}