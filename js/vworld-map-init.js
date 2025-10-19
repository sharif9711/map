// VWorld 지도 초기화 및 기본 설정

var vworldMap = null;
var vworldMarkers = [];
var vworldOverlays = [];
var vworldRouteLayer = null;
var vworldRouteMarkers = [];
var parcelBoundaryLayer = null;
const VWORLD_API_KEY = 'BE552462-0744-32DB-81E7-1B7317390D68';

// JSONP 콜백 함수를 위한 글로벌 카운터
let vworldCallbackId = 0;

// JSONP 방식으로 VWorld API 호출 (CORS 우회)
function vworldJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'vworldCallback' + vworldCallbackId++;
        
        window[callbackName] = function(data) {
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

// ✅ 새로 추가: 기본 지도 레이어들을 저장할 전역 변수
var vworldSatelliteLayer, vworldGraphicLayer, vworldHybridLayer, osmLayer;

// ✅ 새로 추가: 기본 지도를 변경하는 함수
function changeBaseMap(mapType) {
    if (!vworldMap) return;

    const isSatellite = mapType === 'satellite';
    const isGraphic = mapType === 'graphic';
    const isOsm = mapType === 'osm';

    if (vworldSatelliteLayer) vworldSatelliteLayer.setVisible(isSatellite);
    if (vworldGraphicLayer) vworldGraphicLayer.setVisible(isGraphic);
    if (osmLayer) osmLayer.setVisible(isOsm);
    
    // ✅ 하이브리드(라벨) 레이어는 항상 보이도록 수정
    // if (vworldHybridLayer) vworldHybridLayer.setVisible(isSatellite);
}

// 지도 초기화 (여러 기본 지도 레이어 생성)
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
        // ✅ 레이어들을 개별적으로 생성
        vworldGraphicLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Base/{z}/{y}/{x}.png',
                crossOrigin: 'anonymous'
            }),
            zIndex: 0,
            visible: true // 기본값
        });

        vworldSatelliteLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Satellite/{z}/{y}/{x}.jpeg',
                crossOrigin: 'anonymous'
            }),
            zIndex: 0,
            visible: false
        });

        osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM(),
            zIndex: 0,
            visible: false
        });

        // ✅ 하이브리드(라벨) 레이어는 항상 보이도록 설정 (zIndex를 높여 위에 표시)
        vworldHybridLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Hybrid/{z}/{y}/{x}.png',
                crossOrigin: 'anonymous'
            }),
            opacity: 0.8,
            zIndex: 10,
            visible: true // ✅ 항상 보이도록 설정
        });

        // ✅ [수정] VWorld 연속 지적도 WMS 레이어 추가
        const wms_title = '지적도';
        const wms_val = 'LP_PA_CBND_BUBUN,LP_PA_CBND_BONBUN'.toLowerCase();
        const vworldWmsLayer = new ol.layer.Tile({
            name: "VWorld_WMS_LAYER", // ✅ 레이어를 식별할 고유 이름
            source: new ol.source.TileWMS({
                url: "https://api.vworld.kr/req/wms?",
                params: {
                    LAYERS: wms_val,
                    STYLES: wms_val,
                    CRS: "EPSG:3857",
                    apikey: VWORLD_API_KEY,
                    DOMAIN: "http://localhost:8080", // 실제 도메인으로 변경 필요
                    title: wms_title,
                    FORMAT: "image/png"
                }
            }),
            opacity: 0.5, // 기본 투명도
            zIndex: 1 // 기본 지도 위, 마커 아래
        });

        vworldMap = new ol.Map({
            target: 'vworldMap',
            layers: [
                vworldGraphicLayer, // 기본 레이어로 추가
                vworldSatelliteLayer,
                osmLayer,
                vworldHybridLayer, // 라벨 레이어 추가
                vworldWmsLayer // ✅ 연속 지적도 레이어 추가
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([126.978, 37.5665]),
                zoom: 12
            }),
            controls: [
                new ol.control.Zoom(),
                new ol.control.Attribution(),
                new ol.control.FullScreen(),
                new ol.control.ScaleLine()
            ]
        });

        console.log('✅ VWorld map initialized with multiple base layers');

        // ✅ [수정] 지도와 레이어가 모두 생성된 후에 이벤트 리스너를 연결합니다.
        // 기본 지도 선택 이벤트 리스너
        const baseMapSelector = document.getElementById('baseMapSelector');
        if (baseMapSelector) {
            baseMapSelector.addEventListener('change', function(e) {
                changeBaseMap(e.target.value);
            });
        } else {
            console.warn('baseMapSelector element not found.');
        }

        // ✅ [수정] 연속 지적도 투명도 조절 이벤트 리스너
        const parcelOpacitySlider = document.getElementById('parcelOpacitySlider');
        if (parcelOpacitySlider) {
            parcelOpacitySlider.addEventListener('input', function(e) {
                const opacity = parseFloat(e.target.value);
                if (vworldMap) {
                    vworldMap.getLayers().forEach(function(layer) {
                        // ✅ name 속성을 이용해 WMS 레이어에 접근하여 투명도 설정
                        if (layer.get('name') === 'VWorld_WMS_LAYER') {
                            layer.setOpacity(opacity);
                        }
                    });
                }
            });
        } else {
            console.warn('parcelOpacitySlider element not found.');
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize VWorld map:', error);
    }
}

// VWorld 기본 지번도 사용
function showParcelBoundaries() {
    if (!vworldMap) {
        console.error('VWorld map not initialized for parcel boundaries');
        return;
    }
    
    // 이미 레이어가 있으면 제거
    if (parcelBoundaryLayer) {
        vworldMap.removeLayer(parcelBoundaryLayer);
        parcelBoundaryLayer = null;
    }
    
    try {
        console.log('🗺️ Adding VWorld default parcel layer...');
        
        // VWorld에서 제공하는 기본 지적도 레이어
        parcelBoundaryLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/gray/{z}/{y}/{x}.png',
                crossOrigin: 'anonymous'
            }),
            opacity: 0.4,
            zIndex: 1,
            visible: true
        });
        
        vworldMap.addLayer(parcelBoundaryLayer);
        console.log('✅ VWorld default parcel layer added');
        
    } catch (error) {
        console.error('❌ Failed to add parcel layer:', error);
    }
}

// 주소를 좌표로 변환 (JSONP 방식으로 변경)
async function geocodeAddressVWorld(address) {
    if (!address || address.trim() === '') {
        return null;
    }

    try {
        const url = 'https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=' + encodeURIComponent(address) + '&refine=true&simple=false&format=json&type=road&key=' + VWORLD_API_KEY;
        
        const data = await vworldJsonp(url);

        if (data && data.response && data.response.status === 'OK' && data.response.result) {
            const point = data.response.result.point;
            return {
                lon: parseFloat(point.x),
                lat: parseFloat(point.y),
                address: address
            };
        }
    } catch (error) {
        console.error('Geocoding error for address:', address, error);
    }
    
    return null;
}

// ===================================================================
// 참고: getAddressDetailInfo 함수는 이제 js/project-detail.js 파일에 있습니다.
// 이 파일에서는 더 이상 관리하지 않습니다.
// ===================================================================
