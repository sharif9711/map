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

    content.innerHTML = markerListData.map((item, index) => {
        let statusColor = 'bg-blue-100 text-blue-700';
        if (item.상태 === '완료') statusColor = 'bg-green-100 text-green-700';
        if (item.상태 === '보류') statusColor = 'bg-amber-100 text-amber-700';
        
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
    }).join('');
}

// 특정 마커로 포커스 - ✅ 수정: 디버깅 로그 추가
function focusOnMarker(index) {
    // ✅ 디버깅 로그
    console.log(`focusOnMarker called with index: ${index}`);
    console.log('markerListData at index:', markerListData[index]);

    if (index < 0 || index >= markerListData.length) {
        console.error('Invalid marker index:', index);
        return;
    }
    
    const item = markerListData[index];
    const mapType = currentProject.mapType || 'kakao';
    
    if (mapType === 'kakao') {
        if (item.lat && item.lng && kakaoMap) {
            const position = new kakao.maps.LatLng(item.lat, item.lng);
            kakaoMap.setCenter(position);
            kakaoMap.setLevel(3);
        }
    } else if (mapType === 'vworld') {
        if (item.lat && item.lng && vworldMap) {
            const position = ol.proj.fromLonLat([item.lng, item.lat]);
            vworldMap.getView().animate({
                center: position,
                zoom: 17,
                duration: 500
            });
        } else {
            console.error('VWorld map or item coordinates are missing.', { vworldMap: !!vworldMap, item });
        }
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
                                <div style="position: absolute
