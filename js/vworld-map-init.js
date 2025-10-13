// ✅ VWorld 지도 초기화 및 마커 표시
let vMap, vMarkers = [];

function initVWorldMap(containerId = 'map') {
    const container = document.getElementById(containerId);
    if (!container) return;

    vMap = new ol.Map({
        target: container,
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
                    crossOrigin: 'anonymous'
                })
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([127.8, 36.5]),
            zoom: 13
        })
    });

    renderVWorldMarkers();
}

function renderVWorldMarkers() {
    if (!currentProject || !vMap) return;

    vMarkers.forEach(m => vMap.removeLayer(m));
    vMarkers = [];

    const rows = currentProject.data.filter(r => r.주소 && r.lat && r.lng);
    const features = rows.map(r => {
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([r.lng, r.lat])),
            name: r.이름 || '',
            addr: r.주소
        });
        feature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                scale: 0.05
            })
        }));
        return feature;
    });

    const vectorSource = new ol.source.Vector({ features });
    const vectorLayer = new ol.layer.Vector({ source: vectorSource });
    vMap.addLayer(vectorLayer);
    vMarkers.push(vectorLayer);

    if (features.length > 0) {
        const extent = vectorSource.getExtent();
        vMap.getView().fit(extent, { padding: [50, 50, 50, 50] });
    }
}
