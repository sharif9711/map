/*
 * vworld-map-display_v3.8.7_fixed.js
 * CORS / CORB 완전 대응 + HTML 응답 예외 처리 + 중복키 제거 버전
 * by ChatGPT (2025-10)
 */

// ⚙️ 기존 중복 const 방지
if (typeof VWORLD_API_KEY === "undefined") {
  var VWORLD_API_KEY = "BE552462-0744-32DB-81E7-1B7317390D68";
}

// ✅ JSON 전용 Proxy
const VWORLD_PROXY = "https://api.allorigins.win/raw?url=";

/**
 * VWorld API로부터 PNU 기반 필지 외곽 Polygon 데이터 가져오기
 */
async function getParcelBoundary(pnuCode) {
  if (!pnuCode) return null;

  // VWorld 요청 URL (domain 제거)
  const vworldUrl = `https://api.vworld.kr/ned/data/getParcel?service=data&request=getParcel&key=${VWORLD_API_KEY}&pnu=${pnuCode}&format=json`;
  const proxyUrl = `${VWORLD_PROXY}${encodeURIComponent(vworldUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    const text = await response.text();

    // ✅ HTML 응답 감지
    if (text.trim().startsWith("<")) {
      console.warn("⚠️ HTML 응답 수신됨 (CORS 또는 도메인 문제):", text.substring(0, 100));
      return null;
    }

    // ✅ JSON 파싱
    const data = JSON.parse(text);
    const feature = data?.response?.result?.featureCollection?.features?.[0];

    if (!feature || !feature.geometry?.coordinates?.[0]) {
      console.warn("⚠️ 좌표 데이터 없음:", pnuCode);
      return null;
    }

    const coords = feature.geometry.coordinates[0];
    const polygon = new ol.geom.Polygon([coords]);
    return polygon.transform("EPSG:4326", "EPSG:3857");
  } catch (err) {
    console.error("❌ VWorld API 오류:", err);
    return null;
  }
}

/**
 * 지도 초기화
 */
function initVWorldMap() {
  try {
    console.log("Initializing VWorld map...");

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

    console.log("✅ VWorld map initialized");
    return map;
  } catch (e) {
    console.error("❌ 지도 초기화 오류:", e);
    return null;
  }
}

/**
 * 여러 개의 필지를 지도에 표시
 */
async function displayParcelBoundaries(map, pnuList) {
  if (!map || !pnuList?.length) return;

  const features = [];

  for (let i = 0; i < pnuList.length; i++) {
    const pnu = pnuList[i];
    console.log(`📍 필지 요청: ${pnu}`);

    const polygon = await getParcelBoundary(pnu);
    if (!polygon) continue;

    const feature = new ol.Feature({ geometry: polygon });
    feature.setStyle(
      new ol.style.Style({
        stroke: new ol.style.Stroke({ color: "#007bff", width: 2 }),
        fill: new ol.style.Fill({ color: "rgba(0, 123, 255, 0.1)" }),
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
 * 실행 예시 (테스트용)
 */
window.addEventListener("DOMContentLoaded", async () => {
  const map = initVWorldMap();

  // 🔹 테스트용 PNU 리스트 (원하는 코드로 교체 가능)
  const sampleList = [
    "4682035022109703008",
    "4682035022105008018",
    "4682035022105026000",
  ];

  await displayParcelBoundaries(map, sampleList);
});
