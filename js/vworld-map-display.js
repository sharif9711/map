// ================================
// ✅ VWorld 지도 표시 (마커 + 외곽경계선)
// ================================

let parcelVectorLayer = null;

// 지번 외곽선 가져오기
async function getParcelBoundary(pnuCode) {
    if (!pnuCode) return null;
    const url = `https://api.vworld.kr/ned/data/getParcel?key=${VWORLD_API_KEY}&domain=localhost&pnu=${pnuCode}&format=json`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data || !data.response || !data.response.result || data.response.result.featureCollection === null)
            return null;

        const geom = data.response.result.featureCollection.features[0].geometry;
        if (!geom || geom.type !== 'Polygon') return null;

        return new ol.geom.Polygon(geom.coordinates);
    } catch (e) {
        console.error('❌ 필지 외곽선 요청 실패:', pnuCode, e);
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

// 필지 외곽선 표시
async function drawParcelBoundaries(rows) {
    if (!vworldMap) return;

    // 이전 레이어 제거
    if (parcelVectorLayer) {
        vworldMap.removeLayer(parcelVectorLayer);
        parcelVectorLayer = null;
    }

    const features = [];

    for (const row of rows) {
        if (!row.pnu코드 || row.pnu코드.trim() === '') continue;
        const geom = await getParcelBoundary(row.pnu코드);
        if (!geom) continue;

        const color = getStatusColor(row.상태);
        const feature = new ol.Feature({
            geometry: geom.transform('EPSG:4326', 'EPSG:3857'),
            name: row.주소,
            상태: row.상태
        });

        feature.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color,
                    width: 2.5
                }),
                fill: new ol.style.Fill({
                    color: color + '33' // 투명도 20%
                })
            })
        );

        features.push(feature);
    }

    if (features.length === 0) {
        console.log('표시할 필지 외곽선이 없습니다.');
        return;
    }

    const vectorSource = new ol.source.Vector({
        features
    });

    parcelVectorLayer = new ol.layer.Vector({
        source: vectorSource,
        zIndex: 10
    });

    vworldMap.addLayer(parcelVectorLayer);
    console.log(`✅ ${features.length}개의 필지 외곽경계 표시 완료`);
}

// 지도 표시 함수 (기존 + 외곽선)
async function displayProjectOnVWorldMap(projectData) {
    if (!vworldMap) {
        initVWorldMap();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const loadingStatus = document.getElementById('mapLoadingStatus');
    if (!vworldMap) {
        if (loadingStatus) {
            loadingStatus.style.display = 'block';
            loadingStatus.style.backgroundColor = '#ef4444';
            loadingStatus.textContent = '✗ 지도를 초기화할 수 없습니다.';
        }
        return;
    }

    clearVWorldMarkers();

    const validRows = projectData.filter(r => r.주소 && r.주소.trim() !== '');
    if (validRows.length === 0) {
        if (loadingStatus) {
            loadingStatus.style.display = 'block';
            loadingStatus.style.backgroundColor = '#f59e0b';
            loadingStatus.textContent = '⚠ 표시할 주소가 없습니다.';
        }
        return;
    }

    const coordinates = [];
    markerListData = [];

    for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        let coord = null;

        if (row.vworld_lon && row.vworld_lat) {
            coord = { lon: row.vworld_lon, lat: row.vworld_lat };
        } else if (row.lng && row.lat) {
            coord = { lon: row.lng, lat: row.lat };
        } else {
            coord = await geocodeAddressVWorld(row.주소);
        }

        if (coord) {
            const originalRow = currentProject.data.find(r => r.id === row.id);
            if (originalRow) {
                originalRow.vworld_lon = coord.lon;
                originalRow.vworld_lat = coord.lat;
            }

            addVWorldMarker(
                coord,
                row.이름 || '#' + row.순번,
                row.상태,
                row,
                false,
                vworldMarkers.length
            );

            coordinates.push([coord.lon, coord.lat]);
            markerListData.push(row);
        }

        if (loadingStatus)
            loadingStatus.textContent = `좌표 변환 중... (${i + 1}/${validRows.length})`;

        await new Promise(r => setTimeout(r, 200));
    }

    // 지도 뷰 이동
    if (coordinates.length > 0) {
        const extent = ol.extent.boundingExtent(
            coordinates.map(coord => ol.proj.fromLonLat(coord))
        );
        vworldMap.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 17, duration: 1000 });
    }

    // ✅ 필지 외곽경계 표시
    await drawParcelBoundaries(validRows);

    if (loadingStatus) {
        loadingStatus.style.display = 'block';
        loadingStatus.style.backgroundColor = '#10b981';
        loadingStatus.textContent = `✓ ${validRows.length}개 주소 표시 완료`;
        setTimeout(() => { loadingStatus.style.display = 'none'; }, 3000);
    }

    console.log('✅ 모든 마커 및 필지 외곽선 표시 완료');
}
