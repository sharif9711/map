function initKakaoMap(dataList = []) {
  if (typeof kakao === "undefined" || !kakao.maps) {
    console.error("Kakao Map API 로드 실패");
    return;
  }

  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 5
  };
  const map = new kakao.maps.Map(mapContainer, mapOption);

  const geocoder = new kakao.maps.services.Geocoder();

  dataList.forEach(row => {
    if (row.lat && row.lng) {
      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(row.lat, row.lng)
      });
      const infowindow = new kakao.maps.InfoWindow({ content: `<div style="padding:5px;font-size:12px;">${row.이름 || "주소"}<br>${row.주소}</div>` });
      kakao.maps.event.addListener(marker, "click", () => infowindow.open(map, marker));
    } else if (row.주소) {
      geocoder.addressSearch(row.주소, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const latlng = new kakao.maps.LatLng(result[0].y, result[0].x);
          new kakao.maps.Marker({ map, position: latlng });
        }
      });
    }
  });
}
