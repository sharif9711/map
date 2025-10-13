function initMap() {
  const mapContainer = document.getElementById("map");
  mapContainer.innerHTML = ""; // 초기화

  if (!currentProject) return;
  if (currentProject.mapType === "vworld") {
    initVWorldMap(currentProject.data);
  } else {
    initKakaoMap(currentProject.data);
  }
}
