// UI 컴포넌트 HTML 템플릿

function getProjectListHTML() {
    return `
        <header class="border-b border-slate-300/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div class="container mx-auto px-4 py-6">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                            <line x1="9" y1="3" x2="9" y2="18"></line>
                            <line x1="15" y1="6" x2="15" y2="21"></line>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        지도 프로젝트 관리
                    </h1>
                </div>
            </div>
        </header>
        <main class="container mx-auto px-4 py-12">
            <div class="max-w-6xl mx-auto space-y-12">
                <div class="flex flex-col items-center gap-4 text-center">
                    <button onclick="openCreateModal()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                        + 새 프로젝트 만들기
                    </button>
                    <p class="text-slate-600">새로운 지도 프로젝트를 시작하세요</p>
                </div>
                <div id="projectsContainer">
                    <div id="emptyState" class="flex flex-col items-center justify-center py-20 text-center">
                        <div class="p-6 rounded-full bg-slate-200/50 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                                <line x1="9" y1="3" x2="9" y2="18"></line>
                                <line x1="15" y1="6" x2="15" y2="21"></line>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-slate-900 mb-2">아직 프로젝트가 없습니다</h3>
                        <p class="text-slate-600 max-w-md">첫 번째 프로젝트를 만들어서 지도 작업을 시작해보세요</p>
                    </div>
                    <div id="projectsList" style="display: none;">
                        <h2 class="text-xl font-semibold mb-6 text-slate-900">
                            프로젝트 목록 (<span id="projectCount">0</span>)
                        </h2>
                        <div id="projectsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                    </div>
                </div>
            </div>
        </main>
    `;
}

function getProjectDetailHTML() {
    return `
        <div id="normalView">
            <header class="border-b border-slate-300/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <button onclick="backToList()" class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="프로젝트 목록으로">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <h1 id="currentProjectName" class="text-xl font-bold text-slate-900"></h1>
                        <button onclick="showMapView()" class="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            지도
                        </button>
                    </div>
                </div>
            </header>
            <div class="bg-white border-b border-slate-200">
                <div class="container mx-auto px-4">
                    <div class="flex gap-1">
                        <button onclick="switchTab('자료입력')" id="tab-자료입력" class="px-6 py-3 font-medium transition-colors flex items-center gap-2 text-blue-600 border-b-2 border-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            자료입력
                        </button>
                        <button onclick="switchTab('보고서')" id="tab-보고서" class="px-6 py-3 font-medium transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <line x1="12" y1="9" x2="8" y2="9"></line>
                            </svg>
                            보고서
                        </button>
                        <button onclick="switchTab('연결')" id="tab-연결" class="px-6 py-3 font-medium transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            연결
                        </button>
                    </div>
                </div>
            </div>
            <main class="container mx-auto px-4 py-6">
                <div id="content-자료입력" class="tab-content">
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-bold text-slate-900">자료 입력</h2>
                            <span class="text-sm text-slate-600">총 1500행</span>
                        </div>
                        <div class="overflow-auto" style="max-height: 600px;">
                            <table class="w-full border-collapse">
                                <thead class="sticky top-0 bg-slate-100 z-10">
                                    <tr>
                                        <th class="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">순번</th>
                                        <th class="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">이름</th>
                                        <th class="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">연락처</th>
                                        <th class="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">주소</th>
                                    </tr>
                                </thead>
                                <tbody id="dataInputTable"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div id="content-보고서" class="tab-content" style="display: none;">
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-bold text-slate-900">보고서</h2>
                            <div class="flex gap-2">
                                <button onclick="fetchLandInfoForReport()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    토지정보 수집
                                </button>
                                <button onclick="downloadExcel()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    엑셀 다운로드
                                </button>
                            </div>
                        </div>
                        <div class="overflow-auto" style="max-height: 600px;">
                            <table class="w-full border-collapse text-sm">
                                <thead class="sticky top-0 bg-slate-100 z-10">
                                    <tr>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">순번</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">이름</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">연락처</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">주소</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">우편번호</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">상태</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">법정동코드</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">PNU코드</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">대장구분</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">본번</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">부번</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">지목</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">면적</th>
                                        <th class="border border-slate-300 px-3 py-2 font-semibold text-slate-700">기록사항</th>
                                    </tr>
                                </thead>
                                <tbody id="reportTable"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div id="content-연결" class="tab-content" style="display: none;">
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <h2 class="text-lg font-bold text-slate-900 mb-4">연결</h2>
                        <div class="border-2 border-dashed border-slate-300 rounded-lg h-96 flex items-center justify-center">
                            <div class="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-12 w-12 text-slate-400 mx-auto mb-3">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                                <p class="text-slate-600 font-medium">연결 기능</p>
                                <p class="text-sm text-slate-500 mt-2">외부 시스템과의 연결을 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- 지도 뷰 -->
        <div id="mapView" style="display: none;">
            <header class="border-b border-slate-300/50 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <button onclick="hideMapView()" class="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="돌아가기">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <h1 class="text-xl font-bold text-slate-900">지도</h1>
                        <button onclick="if(currentProject && currentProject.data) { displayProjectOnKakaoMap(currentProject.data); } else { console.log('No project data'); }" class="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors">
                            주소 새로고침
                        </button>
                    </div>
                </div>
            </header>
            <div style="height: calc(100vh - 73px); position: relative;">
                <!-- 로딩 상태 -->
                <div id="mapLoadingStatus" class="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 text-sm text-white bg-slate-900/80 rounded-lg backdrop-blur-sm" style="display: none;"></div>
                
                <!-- 왼쪽 상단 컨트롤 버튼들 -->
                <div class="absolute top-4 left-4 z-10 grid grid-cols-2 gap-2">
                    <!-- 첫 번째 줄 -->
                    <button id="toggleGpsBtn" onclick="toggleMyLocation()" class="px-3 py-2 bg-white text-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-colors font-medium text-sm border border-slate-200 whitespace-nowrap">
                        📍 GPS
                    </button>
                    <button id="toggleListBtn" onclick="toggleMarkerList()" class="px-3 py-2 bg-white text-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-colors font-medium text-sm border border-slate-200 whitespace-nowrap">
                        📋 목록
                    </button>
                    
                    <!-- 두 번째 줄 -->
                    <button id="optimalRouteBtn" onclick="calculateOptimalRoute()" class="px-3 py-2 bg-white text-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-colors font-medium text-sm border border-slate-200 whitespace-nowrap">
                        🗺️ 최적경로
                    </button>
                    <button id="toggleLabelsBtn" onclick="toggleMarkerLabels()" class="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap">
                        🏷️ 이름
                    </button>
                </div>

                <!-- 마커 목록 패널 -->
                <div id="markerListPanel" class="absolute top-4 left-[220px] z-10 bg-white rounded-lg shadow-xl w-80 max-w-[calc(100vw-240px)] max-h-[calc(100vh-150px)] overflow-hidden" style="display: none;">
                    <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 class="font-bold text-slate-900">마커 목록</h3>
                        <button onclick="toggleMarkerList()" class="p-1 hover:bg-slate-100 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div id="markerListContent" class="overflow-y-auto max-h-[calc(100vh-220px)]">
                        <!-- 목록이 여기에 동적으로 추가됩니다 -->
                    </div>
                </div>

                <!-- 지도 -->
                <div id="kakaoMap" style="width: 100%; height: 100%;"></div>
                
                <!-- 하단 정보창 -->
                <div id="bottomInfoPanel" class="absolute bottom-0 left-0 right-0 z-20" style="display: none;">
                </div>
                
                <!-- 메모 모달 -->
                <div id="memoModal" class="fixed inset-0 bg-black/50 items-center justify-center z-30" style="display: none;">
                    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 class="text-lg font-bold text-slate-900 mb-4">메모 추가</h3>
                        <textarea id="memoInput" rows="4" placeholder="메모 내용을 입력하세요" 
                                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                        <div class="flex gap-3 mt-4">
                            <button onclick="closeMemoModal()" 
                                    class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                취소
                            </button>
                            <button onclick="saveMemo()" 
                                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(100%);
                    opacity: 0;
                }
            }
        </style>
    `;
}

function getCreateModalHTML() {
    return `
        <div class="fixed inset-0 bg-black/50 items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-xl font-bold text-slate-900">새 프로젝트 만들기</h2>
                        <button onclick="closeCreateModal()" class="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <p class="text-sm text-slate-600 mb-6">프로젝트 정보를 입력하고 완료 버튼을 클릭하세요.</p>
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-slate-700">프로젝트 이름</label>
                            <input type="text" id="projectName" placeholder="프로젝트 이름을 입력하세요" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-slate-700">지도 유형</label>
                            <div class="flex gap-3">
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="mapType" value="kakao" id="mapTypeKakao" checked class="peer hidden">
                                    <div class="border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 rounded-lg p-4 transition-all hover:border-slate-400">
                                        <div class="flex items-center gap-2 mb-2">
                                            <div class="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                                                <div class="w-2 h-2 bg-white rounded-full hidden peer-checked:block"></div>
                                            </div>
                                            <span class="font-semibold text-slate-900">카카오맵</span>
                                        </div>
                                        <p class="text-xs text-slate-600">상세한 주소 검색과 길찾기</p>
                                    </div>
                                </label>
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="mapType" value="vworld" id="mapTypeVworld" class="peer hidden">
                                    <div class="border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 rounded-lg p-4 transition-all hover:border-slate-400">
                                        <div class="flex items-center gap-2 mb-2">
                                            <div class="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                                                <div class="w-2 h-2 bg-white rounded-full hidden peer-checked:block"></div>
                                            </div>
                                            <span class="font-semibold text-slate-900">VWorld</span>
                                        </div>
                                        <p class="text-xs text-slate-600">토지 정보와 지적도</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div class="flex gap-3 pt-4">
                            <button onclick="closeCreateModal()" class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors">취소</button>
                            <button onclick="createProject()" class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors">완료</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// === 상단 진행바 + 알림 ===
function createProgressAndToastUI() {
    const bar = document.createElement('div');
    bar.id = 'progressBar';
    bar.style.cssText = `
        position: fixed; top: 0; left: 0; height: 5px;
        width: 0%; background: linear-gradient(90deg,#3b82f6,#8b5cf6);
        z-index: 9999; transition: width 0.3s ease;
    `;
    document.body.appendChild(bar);

    const toast = document.createElement('div');
    toast.id = 'toastMessage';
    toast.style.cssText = `
        position: fixed; top: 15px; right: 20px; 
        background: rgba(30,41,59,0.9); color: #fff; 
        padding: 10px 16px; border-radius: 8px; 
        font-size: 14px; font-weight: 600; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        opacity: 0; pointer-events: none; z-index: 10000;
        transition: opacity 0.4s ease;
    `;
    document.body.appendChild(toast);
}

function showProgress(percent) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = percent + '%';
}

function showToast(message, duration = 2500) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}
