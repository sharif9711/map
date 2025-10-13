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
// 최종 수정된 기능: 주소로 상세 토지 정보(PNU 코드 등) 가져오기
// ===================================================================

/**
 * 주소를 기반으로 VWorld 토지(필지) 검색 API를 호출하여 상세 정보를 가져옵니다.
 * @param {string} address - 검색할 주소
 * @returns {Promise<object|null>} 토지 정보 객체 또는 null
 */
async function getAddressDetailInfo(address) {
    if (!address || address.trim() === '') {
        return null;
    }

    try {
        // 1. 주소를 좌표(위도, 경도)로 변환합니다.
        const coord = await geocodeAddressVWorld(address);
        if (!coord) {
            console.warn(`좌표 변환 실패: ${address}`);
            return null;
        }

        // 2. VWorld 토지 검색 API를 호출합니다.
        const apiUrl = `https://api.vworld.kr/req/data?` +
            `service=data&request=GetFeature&data=lp_pa_cbnd_bubun&` + // 토지 지적도 레이어
            `format=json&crs=epsg:4326&` +
            `geomfilter=POINT(${coord.lon} ${coord.lat})&` + // 해당 좌표의 필지를 필터링
            `geometry=false&attribute=true&` +
            `key=${VWORLD_API_KEY}`;

        const data = await vworldJsonp(apiUrl);

        // 3. <<< 중요: API 응답 경로를 올바르게 수정했습니다. >>>
        if (data && data.response && data.response.status === 'OK' && data.response.result && data.response.result.featureCollection && data.response.result.featureCollection.features.length > 0) {
            const feature = data.response.result.featureCollection.features[0];
            const properties = feature.properties;

            // 4. <<< API가 제공하는 필드에 맞춰 정보를 매핑합니다. >>>
            const pnu = properties.pnu;
            let bjdCode = null;
            if (pnu && pnu.length >= 10) {
                bjdCode = pnu.substring(0, 10); // PNU 코드 앞 10자리가 법정동코드
            }

            // API 응답 필드명을 애플리케이션 필드명에 맞게 매핑
            return {
                pnuCode: pnu, // PNU 코드
                bjdCode: bjdCode, // PNU에서 추출한 법정동코드
                대장구분: properties.jibun && properties.jibun.includes('대') ? '토지대장' : '임야대장', // '대' 또는 '임'으로 구분
                본번: properties.bonbun, // 본번
                부번: properties.bubun, // 부번
                지목: null, // 이 API에서는 지목 정보를 제공하지 않음
                면적: null, // 이 API에서는 면적 정보를 제공하지 않음
                zipCode: null // 이 API에서는 우편번호 정보를 제공하지 않음
            };
        } else {
            console.warn(`토지 정보를 찾을 수 없습니다: ${address}`);
            return null;
        }

    } catch (error) {
        console.error(`토지 정보 조회 오류 (${address}):`, error);
        return null;
    }
}
