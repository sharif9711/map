// VWorld 필지 외곽선 표시 (상태별 색상 + 자동 표시)

var parcelLayer = null;
var parcelFeatureMap = {}; // 좌표별 필지 저장

// 상태별 필지 스타일 (외곽선 색상 + 5% 불투명도)
function getParcelStyle(status) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS['예정'];
    
    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: colors.main,
            width: 3
        }),
        fill: new ol.style.Fill({
            color: colors.main.replace('rgb(', 'rgba(').replace(')', ', 0.95)') // 외곽선과 동일한 색상, 5% 불투명도
        })
    });
}

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
        zIndex: 3
    });

    vworldMap.addLayer(parcelLayer);
    console.log('✅ Parcel layer initialized');
}

// 필지 외곽선 제거
function clearParcelBoundaries() {
    if (parcelLayer) {
        parcelLayer.getSource().clear();
        parcelFeatureMap = {};
    }
}

// 좌표로 필지 외곽선 조회 및 표시
function showParcelBoundary(lon, lat, status) {
    if (!parcelLayer) {
        initParcelLayer();
    }

    const point3857 = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    const geomfilter = `POINT(${point3857[0]} ${point3857[1]})`;
    const key = `${lon}_${lat}`;

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
                const parcelStyle = getParcelStyle(status);
                
                features.forEach(f => {
                    f.setStyle(parcelStyle);
                    f.set('coordKey', key);
                    f.set('status', status);
                    parcelLayer.getSource().addFeature(f);
                });
                
                parcelFeatureMap[key] = { features, status };
                console.log(`✅ 필지 외곽선 표시: ${key} (${status})`);
            }
        },
        error: function(error) {
            console.error('필지 외곽선 조회 오류:', error);
        }
    });
}

// 필지 색상 업데이트 (상태 변경 시)
function updateParcelColor(lon, lat, newStatus) {
    const key = `${lon}_${lat}`;
    
    if (parcelFeatureMap[key]) {
        const newStyle = getParcelStyle(newStatus);
        parcelFeatureMap[key].features.forEach(f => {
            f.setStyle(newStyle);
            f.set('status', newStatus);
        });
        parcelFeatureMap[key].status = newStatus;
        console.log(`✅ 필지 색상 변경: ${key} -> ${newStatus}`);
    }
}

// 모든 마커에 대해 필지 자동 표시
function showAllParcelBoundariesAuto() {
    if (!vworldMap || vworldMarkers.length === 0) {
        return;
    }

    if (!parcelLayer) {
        initParcelLayer();
    }

    clearParcelBoundaries();

    console.log(`🗺️ ${vworldMarkers.length}개 필지 자동 표시 시작`);

    vworldMarkers.forEach((markerItem, index) => {
        const rowData = markerItem.rowData;
        const lon = rowData.vworld_lon || rowData.lng || rowData.lon;
        const lat = rowData.vworld_lat || rowData.lat;
        const status = rowData.상태 || '예정';

        if (lon && lat) {
            setTimeout(() => {
                showParcelBoundary(lon, lat, status);
            }, index * 400); // 400ms 간격
        }
    });
}
