// ================================
// ✅ VWorld 지도 표시 (JSONP + 외곽경계선 + 마커 + 이름 개선)
// ================================

let parcelVectorLayer = null;

// JSONP 요청 (CORS 우회)
function vworldJsonpRequest(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_cb_' + Math.random().toString(36).substr(2, 9);
        window[callbackName] = (data) => {
            resolve(data);
            delete window[callbackName];
            document.body.removeChild(script);
        };
        const script = document.createElement('script');
        script.src = url + '&callback=' + callbackName;
        script.onerror = () => {
            reject(new Error('JSONP request failed'));
            delete window[callbackName];
            document.body.removeChild(script);
        };
        document.body.appendChild(script);
    });
}

// 지번 외곽선 요청
// 지번 외곽선 요청 (XML 방식)
async function getParcelBoundary(pnuCode) {
    if (!pnuCode) return null;
    const url = `https://api.vworld.kr/ned/data/getParcel?service=data&request=getParcel&key=${VWORLD_API_KEY}&pnu=${pnuCode}&format=xml&domain=sharif9711.github.io`;

    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_cb_' + Math.random().toString(36).substr(2, 9);
        window[callbackName] = (xmlText) => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                const coordNode = xmlDoc.querySelector("polygon");
                if (!coordNode) {
                    console.warn('⚠️ polygon 데이터 없음:', pnuCode);
                    resolve(null);
                    return;
                }

                const coordText = coordNode.textContent.trim();
                const coordPairs = coordText.split(' ').map(p => p.split(',').map(Number));
                if (coordPairs.length === 0) {
                    console.warn('⚠️ 좌표 없음:', pnuCode);
                    resolve(null);
                    return;
                }

                const polygon = new ol.geom.Polygon([coordPairs]);
                resolve(polygon);
            } catch (err) {
                console.error('XML 파싱 오류:', err);
                resolve(null);
            } finally {
                delete window[callbackName];
            }
        };

        // JSONP <script> 요청
        const script = document.createElement('script');
        script.src = `${url}&callback=${callbackName}`;
        script.onerror = () => {
            reject(new Error('JSONP(XML) 요청 실패'));
            delete window[callbackName];
            document.body.removeChild(script);
        };
        document.body.appendChild(script);
    });
}


// 상태별 색상
function getStatusColor(status) {
    switch (status) {
        case '완료': return '#10b981';
        case '보류': return '#f59e0b';
        default: return '#3b82f6';
    }
}

// 필지 외곽선 표시
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

        feature.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({ color, width: 2.5 }),
                fill: new ol.style.Fill({ color: color + '33' })
            })
        );

        features.push(feature);
    }

    if (features.length === 0) {
        console.log('❌ 표시할 필지 외곽선이 없습니다.');
        return;
    }

    const vectorSource = new ol.source.Vector({ features });
    parcelVectorLayer = new ol.layer.Vector({ source: vectorSource, zIndex: 8 });
    vworldMap.addLayer(parcelVectorLayer);
    console.log(`✅ ${features.length}개의 필지 외곽경계 표시 완료`);
}

// 마커 및 이름 표시 (이름이 마커 위에 표시되도록 개선)
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) return null;

    const color = getStatusColor(status);
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0 C7.16 0 0 7.16 0 16 C0 25 16 42 16 42 C16 42 32 25 32 16 C32 7.16 24.84 0 16 0 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
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

const labelOverlay = new ol.Overlay({
    position: ol.proj.fromLonLat([coordinate.lon, coordinate.lat]),
    element: labelEl,
    positioning: 'bottom-center',
    stopEvent: false,
    zIndex: 25
});

    // 이름 오버레이 (마커 위쪽에 위치)
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
        stopEvent: false
    });

    vworldMap.addOverlay(markerOverlay);
    vworldMap.addOverlay(labelOverlay);
    vworldMarkers.push({ marker: markerOverlay, labelOverlay, rowData });
}

// 지도 전체 표시
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

    clearVWorldMarkers();

    const rows = projectData.filter(r => r.주소 && r.주소.trim() !== '');
    const coords = [];

    for (const row of rows) {
        let coord = null;
        if (row.vworld_lon && row.vworld_lat)
            coord = { lon: row.vworld_lon, lat: row.vworld_lat };
        else
            coord = await geocodeAddressVWorld(row.주소);

        if (coord) {
            addVWorldMarker(coord, row.이름, row.상태, row, false, vworldMarkers.length);
            coords.push([coord.lon, coord.lat]);
        }
    }

    if (coords.length > 0) {
        const extent = ol.extent.boundingExtent(coords.map(c => ol.proj.fromLonLat(c)));
        vworldMap.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 18 });
    }

    // ✅ 필지 외곽선 표시
    await drawParcelBoundaries(rows);

    if (loading) {
        loading.style.backgroundColor = '#10b981';
        loading.textContent = '지도 표시 완료';
        setTimeout(() => (loading.style.display = 'none'), 3000);
    }

    console.log('✅ 모든 마커 및 외곽선 표시 완료');
}
