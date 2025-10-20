// ✅ 기존 js/map-controls.js 파일의 맨 위에 이 함수들을 추가하세요

// 사이드바 토글 함수 (모바일 - 완전히 숨김/보임)
function toggleSidebar() {
    const sidebar = document.getElementById('mapSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('hidden');
        overlay.classList.toggle('active');
        
        // 아이콘 변경
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('svg');
            if (sidebar.classList.contains('hidden')) {
                // 닫힌 상태 - 햄버거 아이콘
                icon.innerHTML = `
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                `;
            } else {
                // 열린 상태 - X 아이콘
                icon.innerHTML = `
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                `;
            }
        }
    }
}

// 사이드바 접기/펴기 함수 (데스크톱/모바일 공통 - 아이콘만 보이기)
function collapseSidebar() {
    const sidebar = document.getElementById('mapSidebar');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// 전체화면 변경 이벤트 리스너
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    const mapView = document.getElementById('mapView');
    const text = document.getElementById('fullscreenText');
    
    if (!document.fullscreenElement) {
        // 전체화면 종료됨
        if (mapView) mapView.classList.remove('fullscreen-mode');
        if (text) text.textContent = '전체';
    }
}

// 아래는 기존 코드 그대로 유지
// var showLabels = true;
// var myLocationMarker = null;
// ... 등등

// 아래는 기존 코드 그대로 유지
// var showLabels = true;
// var myLocationMarker = null;
// ... 등등

// 지도 컨트롤 기능

var showLabels = true;
var myLocationMarker = null;
var isGpsActive = false;
var markerListData = [];
var myCurrentLocation = null;
var routePolyline = null;
var routeMarkers = []; // 경로 순번 마커들
var isRouteActive = false;

// 마커 목록 토글
function toggleMarkerList() {
    const panel = document.getElementById('markerListPanel');
    const btn = document.getElementById('toggleListBtn');
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-700');
        updateMarkerList();
    } else {
        panel.style.display = 'none';
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700');
    }
}

// js/map-controls.js 파일에서 updateMarkerList() 함수를 찾아서 아래 코드로 교체하세요

// 마커 목록 업데이트
function updateMarkerList() {
    const content = document.getElementById('markerListContent');
    if (!content || markerListData.length === 0) {
        content.innerHTML = `
            <div class="p-8 text-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-slate-300">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p class="text-sm">표시된 마커가 없습니다</p>
            </div>
        `;
        return;
    }

    // 모바일 여부 확인
    const isMobile = window.innerWidth <= 768;

    content.innerHTML = markerListData.map((item, index) => {
        let statusColor = 'bg-blue-100 text-blue-700';
        if (item.상태 === '완료') statusColor = 'bg-green-100 text-green-700';
        if (item.상태 === '보류') statusColor = 'bg-amber-100 text-amber-700';
        
        if (isMobile) {
            // ✅ 모바일: 순번과 이름만 표시
            return `
                <div onclick="focusOnMarker(${index})" 
                     class="p-3 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-all duration-200">
                    <div class="flex items-center justify-between">
                        <div class="bg-white/60 backdrop-blur-md border-slate-200/50 text-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm">
                            ${item.순번}. ${item.이름 || '이름없음'}
                        </div>
                        <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                            ${item.상태}
                        </span>
                    </div>
                </div>
            `;
        } else {
            // ✅ 데스크톱: 전체 정보 표시
            return `
                <div onclick="focusOnMarker(${index})" 
                     class="p-4 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                    <div class="flex items-start gap-3">
                        <div class="bg-white/60 backdrop-blur-md border-slate-200/50 text-slate-800 px-4 py-2 rounded-full text-xs font-semibold border shadow-lg flex-shrink-0">
                            ${item.순번}. ${item.이름 || '이름없음'}
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="mb-1">
                                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                                    ${item.상태}
                                </span>
                            </div>
                            <div class="text-sm text-slate-700 mb-1 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <span class="truncate">${item.연락처 || '-'}</span>
                            </div>
                            <div class="text-xs text-slate-600 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span class="break-words">${item.주소}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// js/map-controls.js 파일에서 focusOnMarker() 함수를 찾아서 아래 코드로 교체하세요

// 특정 마커로 포커스 (확대 기능 추가)
function focusOnMarker(index) {
    if (index < 0 || index >= markerListData.length) return;
    
    const item = markerListData[index];
    const mapType = currentProject.mapType || 'kakao';
    
    if (mapType === 'kakao') {
        // 카카오맵 - 최대 확대
        if (item.lat && item.lng && kakaoMap) {
            const position = new kakao.maps.LatLng(item.lat, item.lng);
            kakaoMap.setCenter(position);
            kakaoMap.setLevel(1); // 최대 확대 (레벨 1)
            
            // 부드러운 애니메이션 효과
            setTimeout(() => {
                kakaoMap.relayout();
            }, 100);
        }
    } else if (mapType === 'vworld') {
        // VWorld - 필지 외곽선이 보이도록 확대
        if (item.lat && item.lng && vworldMap) {
            const position = ol.proj.fromLonLat([item.lng, item.lat]);
            
            // 먼저 해당 위치로 이동
            vworldMap.getView().animate({
                center: position,
                zoom: 19, // 필지가 잘 보이는 줌 레벨
                duration: 500
            });
            
            // 필지 외곽선이 있다면 그 범위에 맞춰 확대
            setTimeout(() => {
                focusOnParcelBoundary(item.lng, item.lat);
            }, 600);
        }
    }
}

// VWorld 필지 외곽선에 맞춰 확대하는 함수 (새로 추가)
function focusOnParcelBoundary(lon, lat) {
    if (!vworldMap || !parcelLayer) return;
    
    const key = `${lon}_${lat}`;
    
    // 해당 좌표의 필지 외곽선 찾기
    if (parcelFeatureMap && parcelFeatureMap[key]) {
        const features = parcelFeatureMap[key].features;
        
        if (features && features.length > 0) {
            // 모든 필지의 범위를 계산
            let extent = ol.extent.createEmpty();
            features.forEach(feature => {
                const featureExtent = feature.getGeometry().getExtent();
                extent = ol.extent.extend(extent, featureExtent);
            });
            
            // 필지 범위에 맞춰 확대 (패딩 추가)
            vworldMap.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 500,
                maxZoom: 20
            });
        } else {
            // 필지 외곽선이 없으면 기본 확대
            const position = ol.proj.fromLonLat([lon, lat]);
            vworldMap.getView().animate({
                center: position,
                zoom: 19,
                duration: 500
            });
        }
    } else {
        // 필지 정보가 없으면 기본 확대
        const position = ol.proj.fromLonLat([lon, lat]);
        vworldMap.getView().animate({
            center: position,
            zoom: 19,
            duration: 500
        });
    }
}
// 내 위치 표시 토글
var gpsWatchId = null;

function toggleMyLocation() {
    const btn = document.getElementById('toggleGpsBtn');
    const mapType = currentProject.mapType || 'kakao';
    
    // 상태 0: OFF → 상태 1: 내 위치 표시
    if (!isGpsActive && !gpsWatchId) {
        if (navigator.geolocation) {
            btn.classList.add('bg-yellow-500', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-700', 'bg-green-600');
            btn.textContent = '📡 검색중...';
            showMapMessage('현재 위치를 검색하고 있습니다...', 'info');
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    if (mapType === 'kakao') {
                        const myPosition = new kakao.maps.LatLng(lat, lng);
                        
                        if (myLocationMarker) {
                            myLocationMarker.setMap(null);
                        }
                        
                        myLocationMarker = new kakao.maps.CustomOverlay({
                            position: myPosition,
                            content: `
                                <div style="position: relative; width: 40px; height: 40px;">
                                    <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 40px;height: 40px;background: rgba(66, 133, 244, 0.3);border-radius: 50%;animation: pulse 2s infinite;"></div>
                                    <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 24px;height: 24px;background: rgba(66, 133, 244, 0.5);border-radius: 50%;border: 3px solid white;box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                                    <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 12px;height: 12px;background: #4285F4;border-radius: 50%;border: 2px solid white;"></div>
                                </div>
                                <style>
                                    @keyframes pulse {
                                        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                                        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                                    }
                                </style>
                            `,
                            map: kakaoMap,
                            zIndex: 10
                        });
                        
                        kakaoMap.setCenter(myPosition);
                        kakaoMap.setLevel(4);
                    } else if (mapType === 'vworld') {
                        if (myLocationMarker) {
                            vworldMap.removeOverlay(myLocationMarker);
                        }
                        
                        const markerElement = document.createElement('div');
                        markerElement.innerHTML = `
                            <div style="position: relative; width: 40px; height: 40px;">
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 40px;height: 40px;background: rgba(66, 133, 244, 0.3);border-radius: 50%;animation: pulse 2s infinite;"></div>
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 24px;height: 24px;background: rgba(66, 133, 244, 0.5);border-radius: 50%;border: 3px solid white;box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 12px;height: 12px;background: #4285F4;border-radius: 50%;border: 2px solid white;"></div>
                            </div>
                            <style>
                                @keyframes pulse {
                                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                                }
                            </style>
                        `;
                        
                        myLocationMarker = new ol.Overlay({
                            position: ol.proj.fromLonLat([lng, lat]),
                            element: markerElement,
                            positioning: 'center-center',
                            stopEvent: false
                        });
                        
                        vworldMap.addOverlay(myLocationMarker);
                        vworldMap.getView().animate({
                            center: ol.proj.fromLonLat([lng, lat]),
                            zoom: 14,
                            duration: 500
                        });
                    }
                    
                    myCurrentLocation = { lat: lat, lng: lng };
                    
                    isGpsActive = true;
                    btn.classList.remove('bg-yellow-500');
                    btn.classList.add('bg-green-600', 'text-white');
                    btn.textContent = '📍 GPS';
                    showMapMessage('내 위치가 표시되었습니다', 'success');
                },
                function(error) {
                    alert('위치 정보를 가져올 수 없습니다: ' + error.message);
                    btn.classList.remove('bg-yellow-500', 'text-white');
                    btn.classList.add('bg-white', 'text-slate-700');
                    btn.textContent = '📍 GPS';
                }
            );
        } else {
            alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
        }
    }
    // 상태 1: 내 위치 표시 → 상태 2: 실시간 추적
    else if (isGpsActive && !gpsWatchId) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-green-600');
        btn.textContent = '🎯 추적';
        showMapMessage('실시간 위치 추적을 시작합니다', 'info');
        
        gpsWatchId = navigator.geolocation.watchPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                if (mapType === 'kakao') {
                    const myPosition = new kakao.maps.LatLng(lat, lng);
                    
                    if (myLocationMarker) {
                        myLocationMarker.setMap(null);
                    }
                    
                    myLocationMarker = new kakao.maps.CustomOverlay({
                        position: myPosition,
                        content: `
                            <div style="position: relative; width: 40px; height: 40px;">
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 40px;height: 40px;background: rgba(66, 133, 244, 0.3);border-radius: 50%;animation: pulse 2s infinite;"></div>
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 24px;height: 24px;background: rgba(66, 133, 244, 0.5);border-radius: 50%;border: 3px solid white;box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                                <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 12px;height: 12px;background: #4285F4;border-radius: 50%;border: 2px solid white;"></div>
                            </div>
                        `,
                        map: kakaoMap,
                        zIndex: 10
                    });
                    
                    kakaoMap.setCenter(myPosition);
                } else if (mapType === 'vworld') {
                    if (myLocationMarker) {
                        vworldMap.removeOverlay(myLocationMarker);
                    }
                    
                    const markerElement = document.createElement('div');
                    markerElement.innerHTML = `
                        <div style="position: relative; width: 40px; height: 40px;">
                            <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 40px;height: 40px;background: rgba(66, 133, 244, 0.3);border-radius: 50%;animation: pulse 2s infinite;"></div>
                            <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 24px;height: 24px;background: rgba(66, 133, 244, 0.5);border-radius: 50%;border: 3px solid white;box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                            <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);width: 12px;height: 12px;background: #4285F4;border-radius: 50%;border: 2px solid white;"></div>
                        </div>
                        <style>
                            @keyframes pulse {
                                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                            }
                        </style>
                    `;
                    
                    myLocationMarker = new ol.Overlay({
                        position: ol.proj.fromLonLat([lng, lat]),
                        element: markerElement,
                        positioning: 'center-center',
                        stopEvent: false
                    });
                    
                    vworldMap.addOverlay(myLocationMarker);
                    vworldMap.getView().setCenter(ol.proj.fromLonLat([lng, lat]));
                }
                
                myCurrentLocation = { lat: lat, lng: lng };
            },
            function(error) {
                console.error('위치 추적 오류:', error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        );
    }
    // 상태 2: 실시간 추적 → 상태 0: OFF
    else {
        if (gpsWatchId) {
            navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = null;
        }
        
        if (myLocationMarker) {
            if (mapType === 'kakao') {
                myLocationMarker.setMap(null);
            } else if (mapType === 'vworld') {
                vworldMap.removeOverlay(myLocationMarker);
            }
            myLocationMarker = null;
        }
        
        isGpsActive = false;
        myCurrentLocation = null;
        btn.classList.remove('bg-green-600', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700');
        btn.textContent = '📍 GPS';
        showMapMessage('GPS가 꺼졌습니다', 'info');
    }
}

// 마커 이름 라벨 토글
function toggleMarkerLabels() {
    showLabels = !showLabels;
    const btn = document.getElementById('toggleLabelsBtn');
    
    if (showLabels) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-700');
    } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700');
    }
    
    const mapType = currentProject.mapType || 'kakao';
    
    if (mapType === 'kakao') {
        kakaoMarkers.forEach(item => {
            if (item.customOverlay) {
                if (showLabels) {
                    item.customOverlay.setMap(kakaoMap);
                } else {
                    item.customOverlay.setMap(null);
                }
            }
        });
    } else if (mapType === 'vworld') {
        vworldMarkers.forEach(item => {
            if (item.labelOverlay) {
                if (showLabels) {
                    vworldMap.addOverlay(item.labelOverlay);
                } else {
                    vworldMap.removeOverlay(item.labelOverlay);
                }
            }
        });
    }
}

// 중복 주소 체크
function checkDuplicateAddresses(addresses) {
    const addressCount = {};
    addresses.forEach(addr => {
        addressCount[addr] = (addressCount[addr] || 0) + 1;
    });
    return addressCount;
}

// 최적 경로 계산 (ON/OFF 토글)
async function calculateOptimalRoute() {
    const btn = document.getElementById('optimalRouteBtn');
    
    if (!currentProject) {
        showMapMessage('프로젝트를 먼저 선택해주세요.', 'warning');
        return;
    }
    
    const mapType = currentProject.mapType || 'kakao';
    
    // 이미 경로가 표시되어 있으면 제거 (OFF)
    if (isRouteActive) {
        // 경로 제거
        if (mapType === 'kakao') {
            if (routePolyline) {
                routePolyline.setMap(null);
                routePolyline = null;
            }
            routeMarkers.forEach(marker => marker.setMap(null));
        } else if (mapType === 'vworld') {
            if (vworldRouteLayer) {
                vworldMap.removeLayer(vworldRouteLayer);
                vworldRouteLayer = null;
            }
            if (vworldRouteMarkers && vworldRouteMarkers.length > 0) {
                vworldRouteMarkers.forEach(marker => vworldMap.removeOverlay(marker));
            }
        }
        
        routeMarkers = [];
        if (typeof vworldRouteMarkers !== 'undefined') {
            vworldRouteMarkers = [];
        }
        isRouteActive = false;
        
        btn.classList.remove('bg-purple-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700');
        btn.textContent = '🗺️ 최적경로';
        
        showMapMessage('경로가 제거되었습니다.', 'info');
        return;
    }
    
    // 경로 계산 시작 (ON)
    if (!myCurrentLocation) {
        showMapMessage('먼저 GPS 버튼을 눌러 현재 위치를 설정해주세요.', 'warning');
        return;
    }
    
    if (markerListData.length === 0) {
        showMapMessage('표시할 마커가 없습니다.', 'warning');
        return;
    }
    
    // 예정 상태인 마커만 필터링
    const pendingMarkers = markerListData.filter(marker => marker.상태 === '예정');
    
    if (pendingMarkers.length === 0) {
        showMapMessage('예정 상태인 마커가 없습니다. (완료/보류 제외)', 'warning');
        return;
    }
    
    btn.classList.remove('bg-white', 'text-slate-700');
    btn.classList.add('bg-yellow-500', 'text-white');
    btn.textContent = '🔄 계산중...';
    
    // 최적 경로 계산
    const visited = new Array(pendingMarkers.length).fill(false);
    const routeOrder = [];
    let currentPos = myCurrentLocation;
    
    for (let i = 0; i < pendingMarkers.length; i++) {
        let nearestIndex = -1;
        let minDistance = Infinity;
        
        for (let j = 0; j < pendingMarkers.length; j++) {
            if (!visited[j]) {
                const distance = getDistance(
                    currentPos.lat, currentPos.lng,
                    pendingMarkers[j].lat, pendingMarkers[j].lng
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = j;
                }
            }
        }
        
        if (nearestIndex !== -1) {
            visited[nearestIndex] = true;
            routeOrder.push({
                lat: pendingMarkers[nearestIndex].lat,
                lng: pendingMarkers[nearestIndex].lng,
                순번: i + 1,
                이름: pendingMarkers[nearestIndex].이름
            });
            currentPos = { 
                lat: pendingMarkers[nearestIndex].lat, 
                lng: pendingMarkers[nearestIndex].lng 
            };
        }
    }
    
    // 경로 그리기 (지도 유형별)
    try {
        if (mapType === 'kakao') {
            if (typeof drawRoadRoute === 'function') {
                await drawRoadRoute(myCurrentLocation, routeOrder);
            } else {
                console.error('drawRoadRoute function not found');
                showMapMessage('경로 그리기 함수를 찾을 수 없습니다.', 'error');
                btn.classList.remove('bg-yellow-500');
                btn.classList.add('bg-white', 'text-slate-700');
                btn.textContent = '🗺️ 최적경로';
                return;
            }
        } else if (mapType === 'vworld') {
            if (typeof drawVWorldRoute === 'function') {
                await drawVWorldRoute(myCurrentLocation, routeOrder);
            } else {
                console.error('drawVWorldRoute function not found');
                showMapMessage('경로 그리기 함수를 찾을 수 없습니다.', 'error');
                btn.classList.remove('bg-yellow-500');
                btn.classList.add('bg-white', 'text-slate-700');
                btn.textContent = '🗺️ 최적경로';
                return;
            }
        }
        
        isRouteActive = true;
        btn.classList.remove('bg-yellow-500');
        btn.classList.add('bg-purple-600', 'text-white');
        btn.textContent = '✓ 경로표시중';
        
        showMapMessage(`최적 경로 완성! 이 ${pendingMarkers.length}개 지점 (예정 상태만)`, 'success');
    } catch (error) {
        console.error('경로 계산 오류:', error);
        showMapMessage('경로 계산 중 오류가 발생했습니다.', 'error');
        btn.classList.remove('bg-yellow-500');
        btn.classList.add('bg-white', 'text-slate-700');
        btn.textContent = '🗺️ 최적경로';
    }
}

// 실제 도로를 따라 경로 그리기 (카카오맵)
async function drawRoadRoute(start, waypoints) {
    const allPoints = [start, ...waypoints];
    const pathCoords = [];
    
    pathCoords.push(new kakao.maps.LatLng(start.lat, start.lng));
    
    for (let i = 0; i < allPoints.length - 1; i++) {
        const origin = allPoints[i];
        const destination = allPoints[i + 1];
        
        try {
            const response = await fetch(
                `https://apis-navi.kakaomobility.com/v1/directions?` +
                `origin=${origin.lng},${origin.lat}&` +
                `destination=${destination.lng},${destination.lat}&` +
                `priority=RECOMMEND`,
                {
                    headers: {
                        'Authorization': `KakaoAK ${KAKAO_REST_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.routes && data.routes[0] && data.routes[0].sections) {
                    data.routes[0].sections.forEach(section => {
                        if (section.roads) {
                            section.roads.forEach(road => {
                                road.vertexes.forEach((coord, idx) => {
                                    if (idx % 2 === 0) {
                                        const lng = coord;
                                        const lat = road.vertexes[idx + 1];
                                        pathCoords.push(new kakao.maps.LatLng(lat, lng));
                                    }
                                });
                            });
                        }
                    });
                }
            } else {
                pathCoords.push(new kakao.maps.LatLng(destination.lat, destination.lng));
            }
        } catch (error) {
            console.error('경로 탐색 오류:', error);
            pathCoords.push(new kakao.maps.LatLng(destination.lat, destination.lng));
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 경로 선 그리기
    routePolyline = new kakao.maps.Polyline({
        map: kakaoMap,
        path: pathCoords,
        strokeWeight: 6,
        strokeColor: '#4A90E2',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        zIndex: 2
    });
    
    // 순번 마커 추가
    waypoints.forEach((point, index) => {
        const markerContent = `
            <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #FF6B6B, #EE5A6F);
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            ">
                ${point.순번}
            </div>
        `;
        
        const customOverlay = new kakao.maps.CustomOverlay({
            map: kakaoMap,
            position: new kakao.maps.LatLng(point.lat, point.lng),
            content: markerContent,
            zIndex: 100
        });
        
        routeMarkers.push(customOverlay);
    });
}

// VWorld 경로 그리기 (OSRM 사용)
async function drawVWorldRoute(start, waypoints) {
    const allPoints = [start, ...waypoints];
    const pathCoords = [];
    
    // 시작점 추가
    pathCoords.push(ol.proj.fromLonLat([start.lng, start.lat]));
    
    // 각 구간을 OSRM으로 경로 찾기
    for (let i = 0; i < allPoints.length - 1; i++) {
        const origin = allPoints[i];
        const destination = allPoints[i + 1];
        
        try {
            // OSRM API 호출 (무료 공개 서버)
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.routes && data.routes[0] && data.routes[0].geometry) {
                    const coordinates = data.routes[0].geometry.coordinates;
                    
                    // GeoJSON 좌표를 OpenLayers 좌표로 변환
                    coordinates.forEach(coord => {
                        pathCoords.push(ol.proj.fromLonLat(coord));
                    });
                    
                    console.log(`OSRM route segment ${i + 1}: ${coordinates.length} points`);
                } else {
                    // OSRM 실패 시 직선으로
                    pathCoords.push(ol.proj.fromLonLat([destination.lng, destination.lat]));
                }
            } else {
                // API 실패 시 직선으로
                pathCoords.push(ol.proj.fromLonLat([destination.lng, destination.lat]));
            }
        } catch (error) {
            console.error('OSRM routing error:', error);
            // 오류 시 직선으로
            pathCoords.push(ol.proj.fromLonLat([destination.lng, destination.lat]));
        }
        
        // API 요청 간격 (OSRM 공개 서버 제한)
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Total route points:', pathCoords.length);
    
    // 경로 선 생성
    const routeLine = new ol.geom.LineString(pathCoords);
    
    const routeFeature = new ol.Feature({
        geometry: routeLine
    });
    
    const routeStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#4A90E2',
            width: 6,
            lineCap: 'round',
            lineJoin: 'round'
        })
    });
    
    routeFeature.setStyle(routeStyle);
    
    const vectorSource = new ol.source.Vector({
        features: [routeFeature]
    });
    
    vworldRouteLayer = new ol.layer.Vector({
        source: vectorSource,
        zIndex: 2
    });
    
    vworldMap.addLayer(vworldRouteLayer);
    
    // 순번 마커 추가
    waypoints.forEach((point, index) => {
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
            <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #FF6B6B, #EE5A6F);
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            ">
                ${point.순번}
            </div>
        `;
        
        const markerOverlay = new ol.Overlay({
            position: ol.proj.fromLonLat([point.lng, point.lat]),
            element: markerElement,
            positioning: 'center-center',
            stopEvent: false
        });
        
        vworldMap.addOverlay(markerOverlay);
        vworldRouteMarkers.push(markerOverlay);
    });
}

// 지도 메시지 표시
function showMapMessage(message, type = 'info') {
    const loadingStatus = document.getElementById('mapLoadingStatus');
    if (!loadingStatus) return;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    loadingStatus.style.display = 'block';
    loadingStatus.style.backgroundColor = colors[type] || colors.info;
    loadingStatus.textContent = message;
    
    setTimeout(() => {
        if (loadingStatus) {
            loadingStatus.style.display = 'none';
        }
    }, 3000);
}

// 거리 계산 (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 거리 반환 (km)
}
