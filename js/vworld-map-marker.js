// VWorld 마커 생성 및 관리

// VWorld 기본 마커 사용 (간단한 핀 모양)
function createVWorldMarker(coordinate, 순번, status) {
    let color = '#3b82f6';  // 파란색
    if (status === '완료') color = '#10b981';  // 초록색
    if (status === '보류') color = '#f59e0b';  // 주황색

    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
        <div style="
            position: relative;
            cursor: pointer;
            transform: translate(-50%, -100%);
        ">
            <!-- 기본 핀 모양 -->
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0 C7.16 0 0 7.16 0 16 C0 24 16 40 16 40 C16 40 32 24 32 16 C32 7.16 24.84 0 16 0 Z" 
                      fill="${color}" 
                      stroke="#fff" 
                      stroke-width="2"/>
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
                <text x="16" y="20" 
                      font-family="Arial" 
                      font-size="10" 
                      font-weight="bold" 
                      fill="${color}" 
                      text-anchor="middle">${순번}</text>
            </svg>
        </div>
    `;

    return markerElement;
}

// 마커 추가 (간소화)
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) {
        console.error('VWorld map not initialized');
        return null;
    }

    const markerElement = createVWorldMarker(coordinate, rowData.순번, status);
    
    const position = ol.proj.fromLonLat([coordinate.lon, coordinate.lat]);
    
    const marker = new ol.Overlay({
        position: position,
        element: markerElement,
        positioning: 'bottom-center',
        stopEvent: false
    });

    vworldMap.addOverlay(marker);

    // 클릭 이벤트
    markerElement.onclick = () => {
        showBottomInfoPanelVWorld(rowData, markerIndex);
    };

    // 이름 라벨 (선택사항 - showLabels가 true일 때만)
    let labelOverlay = null;
    if (showLabels) {
        const labelBg = isDuplicate ? '#ef4444' : '#ffffff';
        const labelColor = isDuplicate ? '#ffffff' : '#1e293b';
        
        const labelElement = document.createElement('div');
        labelElement.innerHTML = `
            <div style="
                background: ${labelBg};
                color: ${labelColor};
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.8);
                pointer-events: none;
            ">${rowData.이름 || '이름없음'}</div>
        `;

        labelOverlay = new ol.Overlay({
            position: position,
            element: labelElement,
            positioning: 'bottom-center',
            offset: [0, -45],
            stopEvent: false
        });

        vworldMap.addOverlay(labelOverlay);
    }

    vworldMarkers.push({ marker, labelOverlay, rowData });
    
    return marker;
}

// 모든 마커 제거
function clearVWorldMarkers() {
    vworldMarkers.forEach(item => {
        vworldMap.removeOverlay(item.marker);
        if (item.labelOverlay) {
            vworldMap.removeOverlay(item.labelOverlay);
        }
    });
    vworldMarkers = [];
}

// 상태 변경 (VWorld용)
function changeVWorldMarkerStatus(markerIndex, newStatus) {
    if (!currentProject || !vworldMarkers[markerIndex]) return;
    
    const markerData = vworldMarkers[markerIndex].rowData;
    markerData.상태 = newStatus;
    
    const row = currentProject.data.find(r => r.id === markerData.id);
    if (row) {
        row.상태 = newStatus;
        if (typeof renderReportTable === 'function') renderReportTable();
    }
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) projects[projectIndex] = currentProject;
    
    // 마커 다시 그리기
    const oldMarker = vworldMarkers[markerIndex];
    vworldMap.removeOverlay(oldMarker.marker);
    
    const newMarkerElement = createVWorldMarker(
        { lon: markerData.lon || markerData.lng, lat: markerData.lat },
        markerData.순번,
        newStatus
    );
    
    newMarkerElement.onclick = () => showBottomInfoPanelVWorld(markerData, markerIndex);
    
    const newMarker = new ol.Overlay({
        position: ol.proj.fromLonLat([markerData.lon || markerData.lng, markerData.lat]),
        element: newMarkerElement,
        positioning: 'bottom-center',
        stopEvent: false
    });
    
    vworldMap.addOverlay(newMarker);
    vworldMarkers[markerIndex].marker = newMarker;
    
    showBottomInfoPanelVWorld(markerData, markerIndex);
}

// 메모 모달 (VWorld용)
function openMemoModalVWorld(markerIndex) {
    const modal = document.getElementById('memoModal');
    if (!modal) return;
    modal.dataset.markerIndex = markerIndex;
    modal.dataset.mapType = 'vworld';
    document.getElementById('memoInput').value = '';
    modal.style.display = 'flex';
}