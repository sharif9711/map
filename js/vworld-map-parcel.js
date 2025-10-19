// VWorld 필지 외곽선 표시 (단순화 버전 - 면적 계산 포함)

var parcelLayer = null;
var parcelFeatureMap = {};

// 상태별 필지 스타일 (rgba 직접 정의)
function getParcelStyle(status) {
    let strokeColor, fillColor;
    
    switch(status) {
        case '예정':
            strokeColor = 'rgba(59, 130, 246, 0.9)';
            fillColor = 'rgba(59, 130, 246, 0.05)';
            break;
        case '완료':
            strokeColor = 'rgba(16, 185, 129, 0.9)';
            fillColor = 'rgba(16, 185, 129, 0.05)';
            break;
        case '보류':
            strokeColor = 'rgba(245, 158, 11, 0.9)';
            fillColor = 'rgba(245, 158, 11, 0.05)';
            break;
        default:
            strokeColor = 'rgba(59, 130, 246, 0.9)';
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

// 폴리곤 면적 계산 함수 (제곱미터)
function calculatePolygonArea(geometry) {
    const coordinates = geometry.getCoordinates()[0];
    const wgs84Coords = coordinates.map(coord => 
        ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')
    );
    
    let area = 0;
    const earthRadius = 6378137;
    
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
    return area;
}

// 좌표로 필지 외곽선 조회 및 표시 + 면적 계산
function showParcelBoundary(lon, lat, status, markerIndex) {
    if (!parcelLayer) {
        initParcelLayer();
    }

    const point3857 = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    const geomfilter = `POINT(${point3857[0]} ${point3857[1]})`;
    const key = `${lon}_${lat}`;

    console.log('🔍 필지 조회:', markerIndex, lon, lat);

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
                console.warn('⚠️ 필지 없음:', lon, lat);
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
                    
                    // 면적 계산
                    const geometry = f.getGeometry();
                    if (geometry && geometry.getType() === 'Polygon') {
                        const area = calculatePolygonArea(geometry);
                        console.log('📐 면적 계산:', area.toFixed(2));
                        
                        // 마커 인덱스로 데이터 찾기
                        if (typeof markerIndex !== 'undefined' && vworldMarkers[markerIndex]) {
                            const rowData = vworldMarkers[markerIndex].rowData;
                            rowData.계산면적 = area.toFixed(2);
                            console.log('✅ 저장 성공:', rowData.주소, rowData.계산면적);
                            
                            // currentProject.data에서도 업데이트
                            if (currentProject && currentProject.data) {
                                const projectRow = currentProject.data.find(r => r.id === rowData.id);
                                if (projectRow) {
                                    projectRow.계산면적 = area.toFixed(2);
                                    console.log('✅ 프로젝트 저장:', projectRow.계산면적);
                                }
                            }
                            
                            // 프로젝트 저장
                            const projectIndex = projects.findIndex(p => p.id === currentProject.id);
                            if (projectIndex !== -1) {
                                projects[projectIndex] = currentProject;
                            }
                            
                            // 테이블 갱신
                            if (typeof renderReportTable === 'function') {
                                renderReportTable();
                            }
                        }
                    }
                });
                
                parcelFeatureMap[key] = { features, status };
                console.log(`✅ 필지 표시 완료: ${key}`);
            }
        },
        error: function(error) {
            console.error('❌ API 오류:', error);
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
        console.warn('⚠️ 마커 없음');
        return;
    }

    if (!parcelLayer) {
        initParcelLayer();
    }

    clearParcelBoundaries();

    console.log(`🗺️ ${vworldMarkers.length}개 필지 표시 시작`);

    vworldMarkers.forEach((markerItem, index) => {
        const rowData = markerItem.rowData;
        const lon = rowData.vworld_lon || rowData.lng || rowData.lon;
        const lat = rowData.vworld_lat || rowData.lat;
        const status = rowData.상태 || '예정';

        console.log(`마커 ${index}:`, lon, lat, rowData.주소);

        if (lon && lat) {
            setTimeout(() => {
                showParcelBoundary(lon, lat, status, index);
            }, index * 400);
        }
    });
}
