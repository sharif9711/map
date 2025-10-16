// VWorld 마커 생성 및 관리

// VWorld 기본 마커 사용 (간단한 핀 모양)
function createVWorldMarker(coordinate, 순번, status) {
    let color = '#3b82f6';  // 파란색
    if (status === '완료') color = '#10b981';  // 초록색
    if (status === '보류') color = '#f59e0b';  // 주황색

    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
        <div style="position: relative; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0 C7.16 0 0 7.16 0 16 C0 24 16 40 16 40 C16 40 32 24 32 16 C32 7.16 24.84 0 16 0 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
                <text x="16" y="20" font-family="Arial" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">${순번}</text>
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
            ">${label || '이름없음'}</div>
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

// 상태 변경 (VWorld용) - ✅ 수정: 오버레이를 제거/생성 대신 내용만 교체
function changeVWorldMarkerStatus(markerIndex, newStatus) {
    console.log(`🟠 [changeVWorldMarkerStatus] 호출됨: index=${markerIndex}, newStatus=${newStatus}`);
    
    if (!currentProject || !vworldMarkers[markerIndex]) {
        console.error('❌ 프로젝트 또는 마커를 찾을 수 없습니다.');
        return;
    }
    
    const markerData = vworldMarkers[markerIndex].rowData;
    markerData.상태 = newStatus;
    
    // 원본 데이터도 업데이트
    const row = currentProject.data.find(r => r.id === markerData.id);
    if (row) {
        row.상태 = newStatus;
        console.log(' - 원본 데이터 업데이트 완료');
        
        // 보고서 테이블 갱신
        if (typeof renderReportTable === 'function') {
            renderReportTable();
        }
    }
    
    // 프로젝트 저장
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
    
    // ✅ 핵심 수정: 오버레이를 새로 만드는 대신 기존 오버레이의 HTML만 교체
    const existingMarkerOverlay = vworldMarkers[markerIndex].marker;
    const newMarkerElement = createVWorldMarker(
        { lon: markerData.lng || markerData.lon, lat: markerData.lat },
        markerData.순번,
        newStatus
    );
    
    // 기존 오버레이의 내용을 새로운 HTML로 교체
    existingMarkerOverlay.getElement().innerHTML = newMarkerElement.innerHTML;
    
    // 클릭 이벤트도 다시 바인딩
    existingMarkerOverlay.getElement().onclick = () => showBottomInfoPanelVWorld(markerData, markerIndex);
    
    // vworldMarkers 배열의 데이터만 업데이트
    vworldMarkers[markerIndex].rowData = markerData;
    
    console.log(`✅ 마커 상태 변경 완료: ${newStatus}`);
    
    // markerListData도 업데이트 (목록에서도 상태가 보이도록)
    const markerListItem = markerListData.find(m => m.순번 === markerData.순번);
    if (markerListItem) {
        markerListItem.상태 = newStatus;
        console.log(' - markerListData 업데이트 완료');
    }
    
    // 필지 경계선도 색상 업데이트 (있다면)
    if (parcelVectorLayer && row.pnu코드) {
        console.log(' - 필지 경계선 색상 업데이트 시작...');
        updateParcelBoundaryColor(row.pnu코드, newStatus);
    }
    
    // 정보창 다시 표시
    showBottomInfoPanelVWorld(markerData, markerIndex);
}

// 필지 경계선 색상 업데이트 함수 추가
function updateParcelBoundaryColor(pnuCode, newStatus) {
    if (!parcelVectorLayer) return;
    
    const source = parcelVectorLayer.getSource();
    const features = source.getFeatures();
    
    // PNU 코드로 해당 필지 찾기
    features.forEach(feature => {
        const featurePnu = feature.get('pnu') || '';
        if (featurePnu === pnuCode) {
            const color = getStatusColor(newStatus);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({ color, width: 2.5 }),
                    fill: new ol.style.Fill({ color: color + '33' })
                })
            );
            console.log(` - 필지 경계선 색상 업데이트 완료: ${pnuCode}`);
        }
    });
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
