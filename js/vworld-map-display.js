// ==============================
// VWorld 지도에 마커 및 외곽선 표시
// ==============================

async function displayProjectOnVWorldMap(projectData) {
    if (!vworldMap) initVWorldMap();

    clearVWorldMarkers();
    console.log(`🗺️ VWorld 지도에 ${projectData.data.length}개의 마커 표시 시작`);

    let validCount = 0;

    for (let i = 0; i < projectData.data.length; i++) {
        const row = projectData.data[i];
        if (!row.주소) continue;

        const coord = await geocodeAddressVWorld(row.주소);
        if (coord) {
            await addVWorldMarker(coord, row.이름, row.상태, row, false, i);
            validCount++;
        }
    }

    console.log(`✅ ${validCount}개의 마커와 외곽선이 VWorld 지도에 표시되었습니다.`);
}
