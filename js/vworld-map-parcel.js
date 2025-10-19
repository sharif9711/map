// VWorld 필지 외곽선 표시 (상태별 색상 + 자동 표시)

var parcelLayer = null;
var parcelFeatureMap = {}; // 좌표별 필지 저장

// 상태별 필지 스타일 (rgba 직접 정의)
function getParcelStyle(status) {
    let strokeColor, fillColor;
    
    switch(status) {
        case '예정':
            strokeColor = 'rgba(59, 130, 246, 0.9)';  // 파란색 외곽선
            fillColor = 'rgba(59, 130, 246, 0.05)';    // 파란색 내부 5% 불투명
            break;
        case '완료':
            strokeColor = 'rgba(16, 185, 129, 0.9)';  // 초록색 외곽선
            fillColor = 'rgba(16, 185, 129, 0.05)';    // 초록색 내부 5% 불투명
            break;
        case '보류':
            strokeColor = 'rgba(245, 158, 11, 0.9)';  // 주황색 외곽선
            fillColor = 'rgba(245, 158, 11, 0.05)';    // 주황색 내부 5% 불투명
            break;
        default:
            strokeColor = 'rgba(59, 130, 246, 0.9)';  // 기본 파란색
            fillColor = 'rgba(59, 130, 246, 0.05)';
    }
    
    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: strokeColor,
            width: 3
        }),
        fill: new ol.style.Fill({
            color: fillColor
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

// 좌표로 필지 외곽선 조회 및 표시 + 면적 계산
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
                    
                    // ✅ 필지 면적 계산
                    const geometry = f.getGeometry();
                    if (geometry && geometry.getType() === 'Polygon') {
                        const area = calculatePolygonArea(geometry);
                        
                        // 현재 프로젝트 데이터에서 해당 행 찾기
                        if (currentProject && currentProject.data) {
                            const row = currentProject.data.find(r => 
                                (r.vworld_lon === lon || r.lng === lon) && 
                                (r.vworld_lat === lat || r.lat === lat)
                            );
                            
                            if (row) {
                                // 계산된 면적을 저장 (제곱미터, 소수점 2자리)
                                row.계산면적 = area.toFixed(2);
                                
                                console.log(`📐 면적 계산 완료: ${row.주소} - ${area.toFixed(2)}㎡`);
                                
                                // 기존 면적과 비교
                                if (row.면적 && row.면적 !== '-') {
                                    const originalArea = parseFloat(row.면적);
                                    const diff = Math.abs(area - originalArea);
                                    const diffPercent = ((diff / originalArea) * 100).toFixed(2);
                                    
                                    if (diff > 0.1) { // 0.1㎡ 이상 차이나면
                                        console.log(`⚠️ 면적 차이: 대장 ${originalArea}㎡ vs 계산 ${area.toFixed(2)}㎡ (차이: ${diff.toFixed(2)}㎡, ${diffPercent}%)`);
                                    }
                                }
                                
                                // 프로젝트 데이터 저장
                                const projectIndex = projects.findIndex(p => p.id === currentProject.id);
                                if (projectIndex !== -1) {
                                    projects[projectIndex] = currentProject;
                                }
                                
                                // 보고서 테이블 갱신
                                if (typeof renderReportTable === 'function') {
                                    renderReportTable();
                                }
                            }
                        }
                    }
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

// ✅ 폴리곤 면적 계산 함수 (제곱미터)
function calculatePolygonArea(geometry) {
    // OpenLayers Polygon geometry에서 좌표 추출
    const coordinates = geometry.getCoordinates()[0]; // 외곽선 좌표
    
    // EPSG:3857 (Web Mercator) 좌표를 EPSG:4326 (WGS84)로 변환
    const wgs84Coords = coordinates.map(coord => {
        return ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
    });
    
    // Shoelace 공식으로 면적 계산 (구면 좌표계 고려)
    let area = 0;
    const earthRadius = 6378137; // 지구 반지름 (미터)
    
    for (let i = 0; i < wgs84Coords.length - 1; i++) {
        const p1 = wgs84Coords[i];
        const p2 = wgs84Coords[i + 1];
        
        const lon1 = p1[0] * Math.PI / 180;
        const lat1 = p1[1] * Math.PI / 180;
        const lon2 = p2[0] * Math.PI / 180;
        const lat2 = p2[1] * Math.PI / 180;
        
        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    area = Math.abs(area * earthRadius * earthRadius / 2.0);
    
    return area; // 제곱미터 반환
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
