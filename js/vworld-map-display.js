// ✅ 공통 Proxy URL (allorigins.win 사용)
const VWORLD_PROXY = "https://api.allorigins.win/get?url=";

/**
 * VWorld API를 통해 필지 외곽선(Polygon)을 가져오는 함수
 * CORB / CORS 완전 차단 회피용 (JSONP 대신 Proxy JSON 방식)
 */
async function getParcelBoundary(pnuCode) {
    if (!pnuCode) return null;

    // VWorld API URL
    const vworldUrl = `https://api.vworld.kr/ned/data/getParcel?service=data&request=getParcel&key=${VWORLD_API_KEY}&pnu=${pnuCode}&format=json`;
    const proxyUrl = `${VWORLD_PROXY}${encodeURIComponent(vworldUrl)}`;

    try {
        // ✅ Proxy를 통해 JSON 응답 받기
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            console.warn("⚠️ Proxy 요청 실패:", response.status);
            return null;
        }

        const data = await response.json();
        if (!data?.contents) {
            console.warn("⚠️ Proxy 응답 비어 있음:", pnuCode);
            return null;
        }

        // ✅ 실제 JSON 파싱
        const parsed = JSON.parse(data.contents);
        if (!parsed?.response?.result?.featureCollection?.features) {
            console.warn("⚠️ 필지 정보 없음:", pnuCode);
            return null;
        }

        const feature = parsed.response.result.featureCollection.features[0];
        if (!feature || !feature.geometry?.coordinates?.[0]) {
            console.warn("⚠️ 좌표 데이터 없음:", pnuCode);
            return null;
        }

        // ✅ Polygon 변환
        const coords = feature.geometry.coordinates[0];
        const polygon = new ol.geom.Polygon([coords]);
        return polygon.transform("EPSG:4326", "EPSG:3857");
    } catch (err) {
        console.error("❌ VWorld API 호출 오류:", err);
        return null;
    }
}

/**
 * 지도 초기화 함수
 */
function initVWorldMap() {
    try {
        console.log("Initializing VWorld map...");

        // ✅ 지도 객체 생성
        const map = new ol.Map({
            target: "map",
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png`,
                    }),
                }),
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg`,
                    }),
                    visible: true,
                }),
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([127.0, 37.5]),
                zoom: 10,
            }),
        });

        console.log("✅ VWorld map initialized with default layers");

        return map;
    } catch (e) {
        console.error("❌ 지도 초기화 오류:", e);
        return null;
    }
}

/**
 * 다수의 PNU를 순회하며 지도에 외곽선 표시
 */
async function displayParcelBoundaries(map, pnuList) {
    if (!map || !pnuList?.length) return;

    const features = [];

    for (let i = 0; i < pnuList.length; i++) {
        const pnu = pnuList[i];
        console.log(`📍 JSON 요청 지역: ${pnu}`);

        const polygon = await getParcelBoundary(pnu);
        if (!polygon) continue;

        const feature = new ol.Feature({ geometry: polygon });
        feature.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({ color: "#00aaff", width: 2 }),
                fill: new ol.style.Fill({ color: "rgba(0, 170, 255, 0.1)" }),
            })
        );

        features.push(feature);
    }

    if (features.length === 0) {
        console.warn("⚠️ 표시할 필지 외곽선이 없습니다.");
        return;
    }

    const vectorSource = new ol.source.Vector({ features });
    const vectorLayer = new ol.layer.Vector({ source: vectorSource });
    map.addLayer(vectorLayer);

    console.log(`✅ ${features.length}개의 필지 외곽선 표시 완료`);
}

/**
 * 초기 실행 예시
 */
window.addEventListener("DOMContentLoaded", async () => {
    const map = initVWorldMap();

    // ✅ 예시용 PNU 목록
    const sampleList = [
        "4682035022109703008",
        "4682035022105008018",
        "4682035022105026000",
    ];

    await displayParcelBoundaries(map, sampleList);
});
