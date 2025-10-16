// ================================
// ✅ VWorld 지도 표시 (XML + 외곽경계선 + 마커 + 이름 개선)
// ================================

let parcelVectorLayer = null;

// 상태별 색상
function getStatusColor(status) {
    switch (status) {
        case '완료': return '#10b981';
        case '보류': return '#f59e0b';
        default: return '#3b82f6';
    }
}

// ✅ 필지 외곽선 XML 방식
async function getParcelBoundary(pnuCode) {
    if (!pnuCode) return null;

    const url = `https://api.vworld.kr/ned/data/getParcel?key=${VWORLD_API_KEY}&pnu=${pnuCode}&domain=sharif9711.github.io&format=xml`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn('❌ 요청 실패:', res.status, pnuCode);
            return null;
        }

        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const polygonTag = xmlDoc.querySelector('polygon');

        if (!polygonTag) {
            console.warn('⚠️ polygon 데이터 없음:', pnuCode);
            return null;
        }

        const coords = polygonTag.textContent
            .trim()
            .split(' ')
            .map(c => c.split(',').map(Number))
            .filter(p => p.length === 2);

        if (coords.length < 3) return null;

        const polygon = new ol.geom.Polygon([coords]);
        return polygon;
    } catch (err) {
        console.error('❌ getParcelBoundary 실패:', err);
        return null;
    }
}

// ✅ 외곽선 그리기
async function drawParcelBoundaries(rows) {
    if (!vworldMap) return;

    if (parcelVectorLayer) {
        vworldMap.removeLayer(parcelVectorLayer);
        parcelVectorLayer = null;
    }

    const features = [];
    for (const row of rows) {
        if (!row.pnu코드) continue;
        const geom = await getParcelBoundary(row.pnu코드);
        if (!geom) continue;

        const color = getStatusColor(row.상태);
        const feature = new ol.Feature({
            geometry: geom.transform('EPSG:4326', 'EPSG:3857'),
            name: row.주소,
        });

        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({ color, width: 2.5 }),
            fill: new ol.style.Fill({ color: color + '33' })
        }));

        features.push(feature);
    }

    if (!features.length) {
        console.log('⚠️ 표시할 필지 없음');
        return;
    }

    const vectorSource = new ol.source.Vector({ features });
    parcelVectorLayer = new ol.layer.Vector({ source: vectorSource, zIndex: 5 });
    vworldMap.addLayer(parcelVectorLayer);
    console.log(`✅ ${features.length}개 필지 외곽경계 표시 완료`);
}

// ✅ 마커 및 이름 표시
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) return;

    const color = getStatusColor(status);
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0 C7.16 0 0 7.16 0 16 C0 25 16 42 16 42 C16 42 32 25 32 16 C32 7.16 24.84 0 16 0 Z"
                  fill="${color}" stroke="#fff" stroke-width="2"/>
            <circle cx="16" cy="16" r="8" fill="white"/>
        </svg>`;
    markerEl.style.cursor = 'pointer';
    markerEl.onclick = () => showBottomInfoPanelVWorld(rowData, markerIndex);

    const markerOverlay = new ol.Overlay({
        position: ol.proj.fromLonLat([coordinate.lon, coordinate.lat]),
        element: markerEl,
        positioning: 'bottom-center',
        stopEvent: false,
        zIndex: 20
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label || '이름없음';
    labelEl.style.cssText = `
        background: rgba(255,255,255,0.9);
        color: #1e293b;
        font-size: 12px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 12px;
        white-space: nowrap;
        position: relative;
        top: -45px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    const labelOverlay = new ol.Overlay({
        position: ol.proj.fromLonLat([coordinate.lon, coordinate.lat]),
        element: labelEl,
        positioning: 'bottom-center',
        stopEvent: false,
        zIndex: 25
    });

    vworldMap.addOverlay(markerOverlay);
    vworldMap.addOverlay(labelOverlay);
    vworldMarkers.push({ marker: markerOverlay, labelOverlay, rowData });
}

// ✅ 지도 전체 표시
async function displayProjectOnVWorldMap(projectData) {
    if (!vworldMap) {
        initVWorldMap();
        await new Promise(r => setTimeout(r, 800));
    }

    const loading = document.getElementById('mapLoadingStatus');
    if (loading) {
        loading.style.display = 'block';
        loading.style.backgroundColor = '#3b82f6';
        loading.textContent = '지도 불러오는 중...';
    }

    clearVWorldMarkers();

    const rows = projectData.filter(r => r.주소 && r.주소.trim() !== '');
    const coords = [];

    for (const row of rows) {
        let coord = row.vworld_lon && row.vworld_lat
            ? { lon: row.vworld_lon, lat: row.vworld_lat }
            : await geocodeAddressVWorld(row.주소);

        if (coord) {
            addVWorldMarker(coord, row.이름, row.상태, row, false, vworldMarkers.length);
            coords.push([coord.lon, coord.lat]);
        }
    }

    if (coords.length) {
        const extent = ol.extent.boundingExtent(coords.map(c => ol.proj.fromLonLat(c)));
        vworldMap.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 18 });
    }

    await drawParcelBoundaries(rows);

    if (loading) {
        loading.style.backgroundColor = '#10b981';
        loading.textContent = '지도 표시 완료';
        setTimeout(() => (loading.style.display = 'none'), 2500);
    }

    console.log('✅ 모든 마커 및 외곽선 표시 완료');
}
