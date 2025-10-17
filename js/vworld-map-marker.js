// =======================
// VWorld 마커 생성/관리 개선 버전
// =======================

let vworldMarkerLayer = null;

// 마커 스타일 함수
function getVWorldMarkerStyle(rowData, isDuplicate) {
    let baseColor = '#3b82f6';
    if (rowData.상태 === '완료') baseColor = '#10b981';
    if (rowData.상태 === '보류') baseColor = '#f59e0b';

    return new ol.style.Style({
        image: new ol.style.Icon({
            src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'>
                <path d='M16 0 C7.16 0 0 7.16 0 16 C0 24 16 40 16 40 C16 40 32 24 32 16 C32 7.16 24.84 0 16 0 Z' 
                      fill='${baseColor}' stroke='white' stroke-width='2'/>
                <circle cx='16' cy='16' r='8' fill='white' opacity='0.9'/>
                <text x='16' y='20' font-family='Arial' font-size='10' font-weight='bold' fill='${baseColor}' text-anchor='middle'>${rowData.순번}</text>
            </svg>`,
            scale: 1,
            anchor: [0.5, 1]
        }),

        text: new ol.style.Text({
            text: rowData.이름 || '이름없음',
            offsetY: -45,
            font: 'bold 12px Arial',
            fill: new ol.style.Fill({ color: isDuplicate ? '#fff' : '#1e293b' }),
            backgroundFill: new ol.style.Fill({
                color: isDuplicate ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.9)'
            }),
            padding: [4, 8, 4, 8],
            borderRadius: 8,
            textAlign: 'center',
            placement: 'point'
        })
    });
}

// 마커 추가
function addVWorldMarker(coordinate, label, status, rowData, isDuplicate, markerIndex) {
    if (!vworldMap) return null;

    // Vector layer 생성 (한 번만)
    if (!vworldMarkerLayer) {
        vworldMarkerLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            zIndex: 5
        });
        vworldMap.addLayer(vworldMarkerLayer);
    }

    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([coordinate.lon, coordinate.lat])),
        rowData
    });

    feature.setStyle(getVWorldMarkerStyle(rowData, isDuplicate));

    vworldMarkerLayer.getSource().addFeature(feature);
    vworldMarkers.push({ feature, rowData });

    // 클릭 이벤트
    vworldMap.on('click', function (evt) {
        vworldMap.forEachFeatureAtPixel(evt.pixel, function (clickedFeature) {
            if (clickedFeature === feature) {
                showBottomInfoPanelVWorld(rowData, markerIndex);
            }
        });
    });

    return feature;
}

// 마커 모두 제거
function clearVWorldMarkers() {
    if (vworldMarkerLayer && vworldMarkerLayer.getSource()) {
        vworldMarkerLayer.getSource().clear();
    }
    vworldMarkers = [];
}
