function initKakaoMap(dataList = []) {
  if (typeof kakao === "undefined" || !kakao.maps) {
    console.error("Kakao Map API 로드 실패");
    return;
  }

  const mapContainer = document.getElementById("map");
  const mapOption = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 5 };
  const map = new kakao.maps.Map(mapContainer, mapOption);
  const geocoder = new kakao.maps.services.Geocoder();

  const colorMap = {
    "예정": "#3B82F6",
    "완료": "#22C55E",
    "보류": "#F59E0B"
  };

  dataList.forEach(row => {
    const color = colorMap[row.상태] || "#94A3B8";
    const markerImg = createCircleMarkerIcon(color);

    if (row.lat && row.lng) {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(row.lat, row.lng),
        map,
        image: markerImg
      });
      addInfo(marker, row);
    } else if (row.주소) {
      geocoder.addressSearch(row.주소, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const latlng = new kakao.maps.LatLng(result[0].y, result[0].x);
          const marker = new kakao.maps.Marker({ position: latlng, map, image: markerImg });
          addInfo(marker, row);
        }
      });
    }
  });

  function addInfo(marker, row) {
    const iw = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;">${row.이름 || "주소"}<br>${row.주소}</div>`
    });
    kakao.maps.event.addListener(marker, "click", () => iw.open(map, marker));
  }
}

// 마커 원형 아이콘 생성 (Canvas 기반)
function createCircleMarkerIcon(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.stroke();
  const imgSrc = canvas.toDataURL();
  return new kakao.maps.MarkerImage(imgSrc, new kakao.maps.Size(32, 32), { offset: new kakao.maps.Point(16, 32) });
}
