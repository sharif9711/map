function initVWorldMap(dataList = []) {
  const map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: `http://api.vworld.kr/req/wmts/1.0.0/BE552462-0744-32DB-81E7-1B7317390D68/Base/{z}/{y}/{x}.png`
        })
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([126.9780, 37.5665]),
      zoom: 16
    })
  });

  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  map.addLayer(vectorLayer);

  dataList.forEach(row => {
    if (row.lng && row.lat) {
      // 상태별 색상 매핑
      const colorMap = {
        "예정": "#3B82F6",
        "완료": "#22C55E",
        "보류": "#F59E0B"
      };
      const color = colorMap[row.상태] || "#94A3B8"; // 기본 회색

      // 마커 생성
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(row.lng), parseFloat(row.lat)]))
      });
      marker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
          src: createColoredMarker(color),
          scale: 0.8
        })
      }));
      vectorSource.addFeature(marker);

      // PNU 경계선 표시
      if (row.pnu코드) {
        fetch(`https://api.vworld.kr/req/data?service=data&request=getfeature&data=LT_C_SPBD_BUBUN&key=BE552462-0744-32DB-81E7-1B7317390D68&attrFilter=pnu:like:${row.pnu코드}`)
          .then(res => res.json())
          .then(json => {
            const feature = json?.response?.result?.featureCollection?.features?.[0];
            if (feature && feature.geometry) {
              const format = new ol.format.GeoJSON();
              const polygon = format.readFeature(feature, {
                dataProjection: "EPSG:4326",
                featureProjection: map.getView().getProjection()
              });
              polygon.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({ color, width: 2 }),
                fill: new ol.style.Fill({ color: `${hexToRgba(color, 0.2)}` })
              }));
              vectorSource.addFeature(polygon);
            }
          });
      }
    }
  });
}

// 동그란 마커를 색상별로 그려주는 DataURI 함수
function createColoredMarker(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 30;
  canvas.height = 30;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(15, 15, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
  return canvas.toDataURL();
}

// HEX → RGBA 변환 유틸
function hexToRgba(hex, alpha) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
