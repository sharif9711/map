// ✅ Kakao Map 초기화 및 마커 표시
let kakaoMap, kakaoGeocoder, kakaoMarkers = [];

function initKakaoMap(containerId = 'map') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const center = new kakao.maps.LatLng(36.5, 127.8);
    kakaoMap = new kakao.maps.Map(container, {
        center: center,
        level: 13
    });

    kakaoGeocoder = new kakao.maps.services.Geocoder();
    renderKakaoMarkers();
}

function renderKakaoMarkers() {
    if (!currentProject || !kakaoMap) return;

    // 기존 마커 제거
    kakaoMarkers.forEach(m => m.setMap(null));
    kakaoMarkers = [];

    const rows = currentProject.data.filter(r => r.주소 && r.lat && r.lng);
    rows.forEach(row => {
        const pos = new kakao.maps.LatLng(row.lat, row.lng);
        const marker = new kakao.maps.Marker({ position: pos });
        marker.setMap(kakaoMap);

        const iwContent = `<div style="padding:5px;font-size:12px;">${row.이름 || ''}<br>${row.주소}</div>`;
        const infowindow = new kakao.maps.InfoWindow({ content: iwContent });

        kakao.maps.event.addListener(marker, 'click', function () {
            infowindow.open(kakaoMap, marker);
        });

        kakaoMarkers.push(marker);
    });

    if (rows.length > 0) {
        const bounds = new kakao.maps.LatLngBounds();
        rows.forEach(r => bounds.extend(new kakao.maps.LatLng(r.lat, r.lng)));
        kakaoMap.setBounds(bounds);
    }
}
