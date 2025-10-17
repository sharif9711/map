// VWorld 필지 외곽선 표시 기능

var parcelLayer = null;
var currentParcelFeatures = [];

// 필지 외곽선 스타일
const parcelPolygonStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0, 128, 255, 0.9)',
        width: 3
    }),
    fill: new ol.style.Fill({
        color: 'rgba(0, 128, 255, 0.2)'
    })
});

// 필지 레이어 초기화
function initParcelLayer() {
    if (!vworldMap) {
        console.error('VWorld map not initialized');
        return;
    }

    if (parcelLayer) {
        vworldMap.removeLayer(parcelLayer);
    }

    parcelLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: parcelPolygonStyle,
        zIndex: 3
    });

    vworldMap.addLayer(parcelLayer);
    console.log('✅ Parcel layer initialized');
}

// 필지 외곽선 제거
function clearParcelBoundaries() {
    if (parcelLayer) {
        parcelLayer.getSource().clear();
        currentParcelFeatures = [];
    }
}

// 좌표로 필지 외곽선 조회 및 표시
function showParcelBoundary(lon, lat) {
    if (!parcelLayer) {
        initParcelLayer();
    }

    const point3857 = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    const geomfilter = `POINT(${point3857[0]} ${point3857[1]})`;

    const params = {
        key: VWORLD_API_KEY,
        service: 'data',
        version: '2.0',
        request: 'getfeature',
        format: 'json',
        size: '10',
        page: '1',
        data: 'LP_PA_CBND_BUBUN',
        geometry: 'true',
        attribute: 'true',
        crs: 'EPSG:3857',
        geomfilter: geomfilter
    };

    $.ajax({
        url: 'https://api.vworld.kr/req/data',
        data: params,
        dataType: 'jsonp',
        success: function(data) {
            if (!data.response || !data.response.result || !data.response.result.featureCollection) {
                console.warn('필지 데이터를 찾을 수 없습니다.');
                return;
            }

            const features = new ol.format.GeoJSON().readFeatures(
                data.response.result.featureCollection
            );

            if (features.length > 0) {
                features.forEach(f => {
                    f.setStyle(parcelPolygonStyle);
                    parcelLayer.getSource().addFeature(f);
                    currentParcelFeatures.push(f);
                });
                console.log(`✅ ${features.length}개의 필지 외곽선 표시 완료`);
            }
        },
        error: function(error) {
            console.error('필지 외곽선 조회 오류:', error);
        }
    });
}

// 모든 마커에 대해 필지 외곽선 표시
function showAllParcelBoundaries() {
    if (!vworldMap || vworldMarkers.length === 0) {
        showMapMessage('표시할 마커가 없습니다.', 'warning');
        return;
    }

    if (!parcelLayer) {
        initParcelLayer();
    }

    clearParcelBoundaries();

    let processedCount = 0;
    const totalMarkers = vworldMarkers.length;

    showMapMessage(`필지 외곽선 조회 중... (0/${totalMarkers})`, 'info');

    vworldMarkers.forEach((markerItem, index) => {
        const rowData = markerItem.rowData;
        const lon = rowData.vworld_lon || rowData.lng || rowData.lon;
        const lat = rowData.vworld_lat || rowData.lat;

        if (lon && lat) {
            setTimeout(() => {
                showParcelBoundary(lon, lat);
                processedCount++;
                
                if (processedCount === totalMarkers) {
                    showMapMessage(`✔ ${totalMarkers}개 필지 외곽선 표시 완료`, 'success');
                }
            }, index * 500);
        }
    });
}

// 필지 외곽선 토글
var isParcelBoundaryVisible = false;

function toggleParcelBoundaries() {
    const btn = document.getElementById('toggleParcelBtn');
    
    if (!btn) {
        console.error('toggleParcelBtn not found');
        return;
    }

    if (!isParcelBoundaryVisible) {
        btn.classList.add('bg-green-600', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-700');
        btn.textContent = '✔ 필지표시중';
        
        showAllParcelBoundaries();
        isParcelBoundaryVisible = true;
    } else {
        btn.classList.remove('bg-green-600', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700');
        btn.textContent = '📐 필지외곽선';
        
        clearParcelBoundaries();
        isParcelBoundaryVisible = false;
        showMapMessage('필지 외곽선이 숨겨졌습니다.', 'info');
    }
}
