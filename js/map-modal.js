// ... (파일의 기존 함수들은 그대로 두세요)

// 거리 계산 (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 거리 반환 (km)
}


// ✅ 파일 가장 아래에 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    // 기본 지도 선택 이벤트 리스너
    const baseMapSelector = document.getElementById('baseMapSelector');
    if (baseMapSelector) {
        baseMapSelector.addEventListener('change', function(e) {
            changeBaseMap(e.target.value);
        });
    }

    // 지적도 투명도 조절 이벤트 리스너
    const parcelOpacitySlider = document.getElementById('parcelOpacitySlider');
    if (parcelOpacitySlider) {
        parcelOpacitySlider.addEventListener('input', function(e) {
            const opacity = parseFloat(e.target.value);
            // vworld-map-parcel.js에서 window.parcelLayer로 접근하도록 설정
            if (window.parcelLayer) {
                window.parcelLayer.setOpacity(opacity);
            }
        });
    }
});
