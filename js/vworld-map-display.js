// ================================
// ✅ VWorld 지도 표시 (표준 API를 사용한 필지 경계선 표시)
// ================================

let parcelVectorLayer = null;

// VWorld 표준 2D 데이터 API를 사용하여 필지 경계선(Polygon) 가져오기
async function getParcelBoundary(pnuCode) {
    if (!pnuCode) return null;

    // VWorld 2D 데이터 API 요청 URL (연속지적도)
    // ✅ 수정: attrfilter를 사용하여 PNU 코드로 직접 필지 경계선 조회 (더 안정적)
    const url = `https://api.vworld.kr/req/data?service=data&request=getfeature&data=LP_PA_CBND_BUBUN&key=${VWORLD_API_KEY}&attrfilter=pnu:${pnuCode}&format=json&size=1`;

    try {
        // vworld-map-init.js 에서 정의한 vworldJsonp 함수 사용 (CORS 문제 해결)
        const data = await vworldJsonp(url);

        if (data.response.status === "OK" && data.response.result.featureCollection.features.length > 0) {
            const feature = data.response.result.featureCollection.features[0];
            const coordinates = feature.geometry.coordinates[0]; // [[lon, lat], [lon, lat], ...]
            
            // OpenLayers의 좌표계(EPSG:3857)로 변환
            const transformedCoords = coordinates.map(coord => ol.proj.fromLonLat(coord));
            
            // OpenLayers 폴리곤 객체 생성
            const polygon = new ol.geom.Polygon([transformedCoords]);
            return polygon;
        } else {
            console.warn('⚠️ 해당 PNU에 대한 필지 경계선 데이터가 없습니다:', pnuCode);
            return null;
        }
    } catch (error) {
        console.error('❌ 필지 경계선 조회 오류:', error);
        return null;
    }
}

// 상태별 색상
function getStatusColor(status) {
    switch (status) {
        case '완료': return '#10b981';
        case '보류': return '#f59e0b';
        default: return '#3b82f6';
    }
}

// 여러 필지의 외곽선을 한 번에 지도에 표시
async function drawParcelBoundaries(rows) {
    if (!vworldMap) return;

    // 기존에 그려진 필지 경계선이 있다면 제거
    if (parcelVectorLayer) {
        vworldMap.removeLayer(parcelVectorLayer);
    }

    const features = [];

    for (const row of rows) {
        if (!row.pnu코드) continue;
        
        const geom = await getParcelBoundary(row.pnu코드);
        if (!geom) continue;

        const color = getStatusColor(row.상태);
        const feature = new ol.Feature({
            geometry: geom,
            name: row.주소,
        });

        feature.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({ color, width: 2.5 }),
                fill: new ol.style.Fill({ color: ol.color.asString(color) + '33' }) // 투명도 추가
            })
        );

        features.push(feature);
    }

    if (features.length === 0) {
        console.log('❌ 표시할 필지 외곽선이 없습니다.');
        return;
    }

    // 벡터 레이어 생성 및 지도에 추가
    const vectorSource = new ol.source.Vector({ features });
    parcelVectorLayer = new ol.layer.Vector({ source: vectorSource, zIndex: 1 }); // 마커 아래에 표시
    vworldMap.addLayer(parcelVectorLayer);
    console.log(`✅ ${features.length}개의 필지 외곽경계 표시 완료`);
}

// 마커 추가 (vworld-map-marker.js의 함수와 통합)
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) return null;

    const color = getStatusColor(status);
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
        <div style="position: relative; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0 C7.16 0 0 7.16 0 16 C0 24 16 40 16 40 C16 40 32 24 32 16 C32 7.16 24.84 0 16 0 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
                <text x="16" y="20" font-family="Arial" font-size="10" font-weight="bold" fill="${color}" text-anchor="middle">${rowData.순번}</text>
            </svg>
        </div>
    `;
    markerEl.onclick = () => showBottomInfoPanelVWorld(rowData, markerIndex);

    const position = ol.proj.fromLonLat([coordinate.lon, coordinate.lat]);
    
    const markerOverlay = new ol.Overlay({
        position: position,
        element: markerEl,
        positioning: 'bottom-center', // 핀의 끝점이 좌표와 일치하도록
        stopEvent: false,
        zIndex: 10
    });
    vworldMap.addOverlay(markerOverlay);

    // 이름 라벨
    let labelOverlay = null;
    if (showLabels) {
        const labelEl = document.createElement('div');
        labelEl.textContent = label || '이름없음';
        labelEl.style.cssText = `background: rgba(255,255,255,0.9); color: #1e293b; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 12px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.8); pointer-events: none;`;
        
        // ✅ 수정: 라벨을 마커 위에 표시하도록 positioning과 offset 변경
        labelOverlay = new ol.Overlay({
            position: position,
            element: labelEl,
            positioning: 'bottom-center', // 라벨의 하단 중앙을 기준으로
            offset: [0, -45], // 좌표에서 45px 위에 라벨 하단을 위치시킴
            stopEvent: false,
            zIndex: 11 // 마커보다 위에 표시
        });
        vworldMap.addOverlay(labelOverlay);
    }

    vworldMarkers.push({ marker: markerOverlay, labelOverlay, rowData });
    return markerOverlay;
}

// 지도 전체 표시 (메인 함수)
async function displayProjectOnVWorldMap(projectData) {
    if (!vworldMap) {
        initVWorldMap();
        await new Promise(r => setTimeout(r, 1000));
    }

    const loading = document.getElementById('mapLoadingStatus');
    if (loading) {
        loading.style.display = 'block';
        loading.style.backgroundColor = '#3b82f6';
        loading.textContent = '지도 불러오는 중...';
    }

    clearVWorldMarkers(); // 기존 마커 제거

    const rows = projectData.filter(r => r.주소 && r.주소.trim() !== '');
    const coords = [];

    // ✅ 수정: 최적경로 기능을 위해 markerListData를 전역 변수에 채워줍니다.
    markerListData = []; 

    for (const row of rows) {
        let coord = null;
        // 이미 좌표가 있으면 재사용
        if (row.lat && row.lng) {
            coord = { lon: parseFloat(row.lng), lat: parseFloat(row.lat) };
        } else {
            // 없으면 주소로 검색
            coord = await geocodeAddressVWorld(row.주소);
            // 검색된 좌표를 원본 데이터에 저장
            if (coord) {
                row.lng = coord.lon;
                row.lat = coord.lat;
            }
        }

        if (coord) {
            addVWorldMarker(coord, row.이름, row.상태, row, false, vworldMarkers.length);
            coords.push([coord.lon, coord.lat]);

            // ✅ 수정: markerListData에 마커 정보 추가
            markerListData.push({
                순번: row.순번, 
                이름: row.이름, 
                연락처: row.연락처, 
                주소: row.주소,
                상태: row.상태, 
                lat: parseFloat(coord.lat), 
                lng: parseFloat(coord.lng), 
                isDuplicate: false // VWorld에서는 중복 체크 로직을 여기에 추가할 수 있습니다.
            });
        }
    }

    if (coords.length > 0) {
        const extent = ol.extent.boundingExtent(coords.map(c => ol.proj.fromLonLat(c)));
        vworldMap.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 18 });
    }

    // ✅ 필지 외곽선 표시 함수 호출
    await drawParcelBoundaries(rows);

    if (loading) {
        loading.style.backgroundColor = '#10b981';
        loading.textContent = '지도 표시 완료';
        setTimeout(() => (loading.style.display = 'none'), 3000);
    }

    console.log('✅ VWorld 지도에 모든 마커 및 외곽선 표시 완료');
}


// ================================
// ✅ VWorld 하단 정보창 관련 함수
// ================================

var currentVWorldMarkerIndex = null;
var currentDisplayedVWorldMarkers = [];

// VWorld 마커 클릭 시 하단 정보창 표시
function showBottomInfoPanelVWorld(rowData, markerIndex) {
    currentVWorldMarkerIndex = markerIndex;
    const sameAddressMarkers = [];
    vworldMarkers.forEach((item, index) => {
        if (item.rowData.주소 === rowData.주소) {
            sameAddressMarkers.push({ index, data: item.rowData });
        }
    });
    currentDisplayedVWorldMarkers = sameAddressMarkers;
    
    const panel = document.getElementById('bottomInfoPanel');
    if (!panel) return;
    
    const markersHtml = sameAddressMarkers.map((markerInfo, idx) => {
        const data = markerInfo.data;
        const mIdx = markerInfo.index;
        const memos = data.메모 || [];
        
        const memosHtml = memos.length > 0 
            ? memos.map((memo, i) => `<div class="text-xs text-slate-600 mb-1"><span class="font-semibold">${i + 1}.</span> ${memo.내용} <span class="text-slate-400">(${memo.시간})</span></div>`).join('')
            : '<div class="text-xs text-slate-400">메모가 없습니다</div>';
        
        return `<div class="bg-white rounded-lg p-6 ${idx > 0 ? 'border-t-2 border-slate-200' : ''}">
            <div class="mb-4 pr-8">
                <h3 class="text-xl font-bold text-slate-900 mb-2">${data.순번}. ${data.이름 || '이름없음'}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                    <a href="tel:${data.연락처 || ''}" class="flex items-center gap-2 hover:text-blue-600 ${!data.연락처 ? 'pointer-events-none opacity-50' : ''}">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span class="underline">${data.연락처 || '-'}</span>
                    </a>
                    <div class="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="text-xs">${data.주소}</span>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-slate-700 mb-2">상태</label>
                <div class="flex gap-2">
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '예정')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '예정' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">예정</button>
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '완료')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '완료' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">완료</button>
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '보류')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '보류' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">보류</button>
                </div>
            </div>
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-slate-700">메모</label>
                    <button onclick="openMemoModalVWorld(${mIdx})" class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ 메모 추가</button>
                </div>
                <div class="bg-slate-50 rounded-lg p-4 max-h-32 overflow-y-auto">${memosHtml}</div>
            </div>
        </div>`;
    }).join('');
    
    panel.innerHTML = `<div class="bg-white rounded-t-2xl shadow-2xl max-w-4xl mx-auto relative">
        <button onclick="hideBottomInfoPanelVWorld()" class="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg z-10">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ${sameAddressMarkers.length > 1 ? `<div class="bg-blue-50 px-6 py-3 border-b border-blue-100"><p class="text-sm text-blue-700 font-medium">ℹ️ 같은 주소에 ${sameAddressMarkers.length}개의 항목이 있습니다</p></div>` : ''}
        <div class="max-h-[70vh] overflow-y-auto">${markersHtml}</div>
    </div>`;
    
    panel.style.display = 'block';
    panel.style.animation = 'slideUp 0.3s ease-out';
}

function hideBottomInfoPanelVWorld() {
    const panel = document.getElementById('bottomInfoPanel');
    if (panel) {
        panel.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => panel.style.display = 'none', 300);
    }
    currentVWorldMarkerIndex = null;
    currentDisplayedVWorldMarkers = [];
}
