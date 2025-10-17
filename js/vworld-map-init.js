// ==============================
// VWorld 지도 초기화 및 필지 외곽선 데이터 요청
// ==============================

var vworldMap = null;
var vworldMarkers = [];
var vworldOverlays = [];
var vworldRouteLayer = null;
var vworldRouteMarkers = [];
var parcelBoundaryLayer = null;
const VWORLD_API_KEY = 'BE552462-0744-32DB-81E7-1B7317390D68';

// JSONP 카운터
let vworldCallbackId = 0;

// JSONP 방식 (주소좌표 변환용)
function vworldJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'vworldCallback' + vworldCallbackId++;
        window[callbackName] = function (data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const script = document.createElement('script');
        script.src = url + '&callback=' + callbackName;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };

        document.body.appendChild(script);

        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('JSONP request timeout'));
            }
        }, 10000);
    });
}

// ==============================
// 지도 초기화 (항공영상 + 지적도 + 라벨)
// ==============================
function initVWorldMap() {
    const mapContainer = document.getElementById('vworldMap');
    if (!mapContainer) {
        console.error('vworldMap element not found');
        return;
    }

    if (vworldMap) {
        vworldMap.setTarget(null);
        vworldMap = null;
    }

    try {
        vworldMap = new ol.Map({
            target: 'vworldMap',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Satellite/{z}/{y}/{x}.jpeg',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0
                }),
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/gray/{z}/{y}/{x}.png',
                        crossOrigin: 'anonymous'
                    }),
                    opacity: 0.4,
                    zIndex: 1
                }),
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Hybrid/{z}/{y}/{x}.png',
                        crossOrigin: 'anonymous'
                    }),
                    opacity: 0.8,
                    zIndex: 2
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([126.978, 37.5665]),
                zoom: 12
            }),
            controls: [
                new ol.control.Zoom(),
                new ol.control.FullScreen(),
                new ol.control.ScaleLine()
            ]
        });

        console.log('✅ VWorld map initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize VWorld map:', error);
    }
}

// ==============================
// 필지 외곽선 GeoJSON 요청
// ==============================
async function getParcelBoundaryGeoJSON(pnu) {
    try {
        const url = `https://api.vworld.kr/req/data?service=data&version=2.0&request=GetFeature&type=LP_PA_CBND_BUBUN&format=geojson&key=${VWORLD_API_KEY}&domain=sharif9711.github.io&crs=EPSG:4326&attrFilter=pnu:like:${pnu}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('WFS 요청 실패');
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
            return data.features[0];
        }
    } catch (err) {
        console.warn('❌ 필지 외곽선 요청 실패:', pnu, err);
    }
    return null;
}
