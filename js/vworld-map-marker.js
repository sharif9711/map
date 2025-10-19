// VWorld 마커 생성 및 관리 (완전 개선 버전)

// 상태별 색상 정의
const STATUS_COLORS = {
    '예정': { main: '#3b82f6', shadow: '#1e40af' },
    '완료': { main: '#10b981', shadow: '#047857' },
    '보류': { main: '#f59e0b', shadow: '#d97706' }
};

// 번호가 있는 마커 SVG 생성 (카카오맵 스타일)
function createVWorldMarkerSVG(순번, status) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS['예정'];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
        <defs>
            <linearGradient id="g${순번}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${colors.main}"/>
                <stop offset="100%" style="stop-color:${colors.shadow}"/>
            </linearGradient>
        </defs>
        <ellipse cx="20" cy="48" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
        <path d="M20 0 C9 0 0 9 0 20 C0 28 20 48 20 48 C20 48 40 28 40 20 C40 9 31 0 20 0 Z" fill="url(#g${순번})" stroke="${colors.shadow}" stroke-width="1.5"/>
        <circle cx="20" cy="18" r="12" fill="white" opacity="0.95"/>
        <text x="20" y="23" font-family="Arial" font-size="12" font-weight="bold" fill="${colors.shadow}" text-anchor="middle">${순번}</text>
    </svg>`;
    
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 마커 추가 (완전히 새로운 방식 - 위치 고정)
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) {
        console.error('VWorld map not initialized');
        return null;
    }

    // OpenLayers Feature 방식으로 마커 생성 (위치 고정)
    const point = new ol.geom.Point(ol.proj.fromLonLat([coordinate.lon, coordinate.lat]));
    
    const markerFeature = new ol.Feature({
        geometry: point,
        rowData: rowData,
        markerIndex: markerIndex
    });

    // 마커 스타일 (아이콘 방식)
    const markerStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: createVWorldMarkerSVG(rowData.순번, status),
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 1
        }),
        zIndex: 100
    });

    markerFeature.setStyle(markerStyle);

    // 마커를 벡터 소스에 추가
    if (!window.vworldMarkerSource) {
        window.vworldMarkerSource = new ol.source.Vector();
        window.vworldMarkerLayer = new ol.layer.Vector({
            source: window.vworldMarkerSource,
            zIndex: 100
        });
        vworldMap.addLayer(window.vworldMarkerLayer);
    }

    window.vworldMarkerSource.addFeature(markerFeature);

    // 이름 라벨 추가 (Overlay 방식 - showLabels에 따라)
    let labelOverlay = null;
    if (showLabels) {
        const labelBg = isDuplicate 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.8))' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))';
        const labelColor = isDuplicate ? '#ffffff' : '#1e293b';
        const labelBorder = isDuplicate ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 255, 255, 0.9)';
        
        const labelElement = document.createElement('div');
        labelElement.innerHTML = `
            <div style="
                background: ${labelBg};
                backdrop-filter: blur(16px);
                color: ${labelColor};
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                white-space: nowrap;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border: 2px solid ${labelBorder};
                pointer-events: none;
            ">${rowData.이름 || '이름없음'}</div>
        `;

        labelOverlay = new ol.Overlay({
            position: ol.proj.fromLonLat([coordinate.lon, coordinate.lat]),
            element: labelElement,
            positioning: 'bottom-center',
            offset: [0, -52],
            stopEvent: false
        });

        vworldMap.addOverlay(labelOverlay);
    }

    vworldMarkers.push({ 
        feature: markerFeature, 
        labelOverlay, 
        rowData 
    });
    
    return markerFeature;
}

// 모든 마커 제거
function clearVWorldMarkers() {
    if (window.vworldMarkerSource) {
        window.vworldMarkerSource.clear();
    }
    
    vworldMarkers.forEach(item => {
        if (item.labelOverlay) {
            vworldMap.removeOverlay(item.labelOverlay);
        }
    });
    
    vworldMarkers = [];
}

// 상태 변경 (위치 고정 유지)
function changeVWorldMarkerStatus(markerIndex, newStatus) {
    if (!currentProject || !vworldMarkers[markerIndex]) return;
    
    const markerItem = vworldMarkers[markerIndex];
    const markerData = markerItem.rowData;
    const oldStatus = markerData.상태;

    // ✅ 상태 변경 메모 추가
    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const memoText = `상태변경: ${oldStatus}->${newStatus} (${timeStr})`;
    if (!markerData.메모) markerData.메모 = [];
    markerData.메모.push({ 내용: memoText, 시간: timeStr });
    
    // ✅ 기록사항 업데이트
    const memoEntry = `${markerData.메모.length}. ${memoText}`;
    markerData.기록사항 = (!markerData.기록사항 || markerData.기록사항.trim() === '' || markerData.기록사항 === '-') 
        ? memoEntry 
        : markerData.기록사항 + '\n\n' + memoEntry;

    // 같은 주소를 가진 모든 마커의 상태를 변경
    const targetAddress = markerData.주소;
    vworldMarkers.forEach((item, index) => {
        if (item.rowData.주소 === targetAddress) {
            item.rowData.상태 = newStatus;
            
            // 마커 스타일만 변경 (위치는 그대로)
            const newStyle = new ol.style.Style({
                image: new ol.style.Icon({
                    src: createVWorldMarkerSVG(item.rowData.순번, newStatus),
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    scale: 1
                }),
                zIndex: 100
            });
            
            item.feature.setStyle(newStyle);
            
            // 필지 외곽선 색상도 변경
            if (typeof updateParcelColor === 'function') {
                const lon = item.rowData.vworld_lon || item.rowData.lng || item.rowData.lon;
                const lat = item.rowData.vworld_lat || item.rowData.lat;
                updateParcelColor(lon, lat, newStatus);
            }
        }
    });

    // 원본 데이터 업데이트
    const row = currentProject.data.find(r => r.id === markerData.id);
    if (row) {
        row.상태 = newStatus;
        row.메모 = markerData.메모;
        row.기록사항 = markerData.기록사항;
        if (typeof renderReportTable === 'function') renderReportTable();
    }
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) projects[projectIndex] = currentProject;
    
    showBottomInfoPanelVWorld(markerData, markerIndex);
}

// 마커 클릭 이벤트 등록
function setupVWorldMarkerClick() {
    if (!vworldMap) return;
    
    vworldMap.on('click', function(evt) {
        const feature = vworldMap.forEachFeatureAtPixel(evt.pixel, function(feature) {
            return feature;
        }, {
            hitTolerance: 5
        });
        
        if (feature && feature.get('rowData')) {
            const rowData = feature.get('rowData');
            const markerIndex = feature.get('markerIndex');
            showBottomInfoPanelVWorld(rowData, markerIndex);
        } else {
            hideBottomInfoPanel();
        }
    });
    
    // 마커 위에서 커서 변경 (오류 방지 개선)
    vworldMap.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        
        const pixel = vworldMap.getEventPixel(evt.originalEvent);
        const hit = vworldMap.hasFeatureAtPixel(pixel, {
            layerFilter: function(layer) {
                return layer === window.vworldMarkerLayer;
            }
        });
        
        const target = vworldMap.getTarget();
        if (target) {
            const element = typeof target === 'string' ? document.getElementById(target) : target;
            if (element) {
                element.style.cursor = hit ? 'pointer' : '';
            }
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
