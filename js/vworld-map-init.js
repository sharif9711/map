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

// 지도 초기화 (위성 영상 + 라벨)
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
                // VWorld 기본 위성 영상
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/Satellite/{z}/{y}/{x}.jpeg',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0
                }),
                // VWorld 기본 지번도 (gray - 지적 경계 포함)
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://api.vworld.kr/req/wmts/1.0.0/' + VWORLD_API_KEY + '/gray/{z}/{y}/{x}.png',
                        crossOrigin: 'anonymous'
                    }),
                    opacity: 0.4,
                    zIndex: 1
                }),
                // 라벨(지명) 레이어
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
                new ol.control.Attribution(),
                new ol.control.FullScreen(),
                new ol.control.ScaleLine()
            ]
        });

        console.log('✅ VWorld map initialized with default layers');
        
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

// ===============================
// VWorld 데이터 API 헬퍼 함수 모음
// ===============================

// 주소 → 좌표 변환
async function getVWorldCoord(address) {
    const url = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0`
        + `&crs=epsg:4326&address=${encodeURIComponent(address)}`
        + `&refine=true&simple=false&type=road&format=json&key=${VWORLD_API_KEY}`;

    try {
        const data = await vworldJsonp(url);
        if (data?.response?.status === 'OK') {
            const p = data.response.result.point;
            return { x: parseFloat(p.x), y: parseFloat(p.y) };
        }
    } catch (e) {
        console.error('❌ getVWorldCoord 실패:', address, e);
    }
    return null;
}

// 좌표 → PNU 코드 변환
async function getVWorldPNU(x, y) {
    const url = `https://api.vworld.kr/ned/data/getParcelInfo?`
        + `key=${VWORLD_API_KEY}&Service=address&Request=getParcelInfo`
        + `&crs=epsg:4326&point=${x},${y}&format=json`;

    try {
        const data = await vworldJsonp(url);
        if (data?.response?.result?.featureCollection?.features?.length) {
            const props = data.response.result.featureCollection.features[0].properties;
            return props.pnu;
        }
    } catch (e) {
        console.error('❌ getVWorldPNU 실패:', e);
    }
    return null;
}

// PNU → 지목/면적 조회
async function getVWorldLandCharacteristics(pnu) {
    const url = `https://api.vworld.kr/ned/data/getLandCharacteristics?`
        + `key=${VWORLD_API_KEY}&pnu=${pnu}&stdrYear=2017&format=json`;

    try {
        const data = await vworldJsonp(url);
        if (data?.response?.result?.featureCollection?.features?.length) {
            return data.response.result.featureCollection.features[0].properties;
        }
    } catch (e) {
        console.error('❌ getVWorldLandCharacteristics 실패:', e);
    }
    return null;
}

// 카카오 주소 → 우편번호
async function getKakaoPostalCode(address) {
    return new Promise((resolve) => {
        if (!window.kakao || !window.kakao.maps) {
            console.error("❌ Kakao Maps SDK가 로드되지 않았습니다.");
            return resolve(null);
        }
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
                resolve(result[0].road_address?.zone_no || result[0].address?.zone_no || null);
            } else resolve(null);
        });
    });
}

