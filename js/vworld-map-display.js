// VWorld 지도 표시 및 프로젝트 데이터 렌더링

// 프로젝트 데이터로 지도에 마커 표시
async function displayProjectOnVWorldMap(projectData) {
    if (!vworldMap) {
        initVWorldMap();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const loadingStatus = document.getElementById('mapLoadingStatus');
    if (!vworldMap) {
        if (loadingStatus) {
            loadingStatus.style.display = 'block';
            loadingStatus.style.backgroundColor = '#ef4444';
            loadingStatus.textContent = '✗ 지도를 초기화할 수 없습니다.';
        }
        return;
    }

    clearVWorldMarkers();

    const addressesWithData = projectData.filter(row => row.주소 && row.주소.trim());
    if (addressesWithData.length === 0) {
        if (loadingStatus) {
            loadingStatus.style.display = 'block';
            loadingStatus.style.backgroundColor = '#f59e0b';
            loadingStatus.textContent = '⚠ 표시할 주소가 없습니다.';
        }
        return;
    }

    const duplicateCheck = checkDuplicateAddresses(addressesWithData.map(r => r.주소));
    if (loadingStatus) {
        loadingStatus.style.display = 'block';
        loadingStatus.style.backgroundColor = '#3b82f6';
        loadingStatus.textContent = '주소 검색 중... (0/' + addressesWithData.length + ')';
    }

    const coordinates = [];
    let successCount = 0;
    markerListData = [];

    // 마커 표시를 2번 반복 (누락 방지)
    for (let attempt = 1; attempt <= 2; attempt++) {
        console.log('========== 마커 표시 시도 ' + attempt + '/2 ==========');
        
        const alreadyAddedAddresses = new Set();
        if (attempt === 2) {
            markerListData.forEach(item => {
                alreadyAddedAddresses.add(item.주소);
            });
            console.log('이미 추가된 마커: ' + alreadyAddedAddresses.size + '개');
        }

        for (let i = 0; i < addressesWithData.length; i++) {
            const row = addressesWithData[i];
            
            if (attempt === 2 && alreadyAddedAddresses.has(row.주소)) {
                console.log('⏭️ Skip (already added): ' + row.주소);
                continue;
            }
            
            let coord = null;
            
            if (row.vworld_lon && row.vworld_lat) {
                coord = {
                    lon: row.vworld_lon,
                    lat: row.vworld_lat,
                    address: row.주소
                };
                console.log('✅ [시도 ' + attempt + '] Using cached VWorld coords for: ' + row.주소);
            } else if (row.lat && row.lng) {
                coord = {
                    lon: row.lng,
                    lat: row.lat,
                    address: row.주소
                };
                console.log('✅ [시도 ' + attempt + '] Using cached Kakao coords for: ' + row.주소);
            } else {
                console.log('🔍 [시도 ' + attempt + '] Searching coordinates for: ' + row.주소);
                coord = await geocodeAddressVWorld(row.주소);
            }
            
            if (coord) {
                if (isNaN(coord.lon) || isNaN(coord.lat)) {
                    console.error('❌ Invalid coordinates:', coord);
                    continue;
                }
                
                const originalRow = currentProject.data.find(r => r.id === row.id);
                if (originalRow) {
                    originalRow.vworld_lon = parseFloat(coord.lon);
                    originalRow.vworld_lat = parseFloat(coord.lat);
                    
                    if (!originalRow.lat || !originalRow.lng) {
                        originalRow.lat = parseFloat(coord.lat);
                        originalRow.lng = parseFloat(coord.lon);
                    }
                }
                
                row.vworld_lon = parseFloat(coord.lon);
                row.vworld_lat = parseFloat(coord.lat);
                
                const isDuplicate = duplicateCheck[row.주소] > 1;
                
                const rowDataWithCoords = {
                    ...row,
                    lon: parseFloat(coord.lon),
                    lat: parseFloat(coord.lat),
                    lng: parseFloat(coord.lon)
                };
                
                const marker = addVWorldMarker(
                    coord, 
                    row.이름 || '#' + row.순번, 
                    row.상태, 
                    rowDataWithCoords, 
                    isDuplicate, 
                    vworldMarkers.length
                );
                
                if (marker) {
                    coordinates.push([coord.lon, coord.lat]);
                    markerListData.push({
                        순번: row.순번,
                        이름: row.이름,
                        연락처: row.연락처,
                        주소: row.주소,
                        상태: row.상태,
                        lat: parseFloat(coord.lat),
                        lng: parseFloat(coord.lon),
                        isDuplicate
                    });
                    
                    successCount++;
                    console.log('✔ [시도 ' + attempt + '] Marker ' + successCount + ' added (' + (i + 1) + '/' + addressesWithData.length + ')');
                }
            }

            if (loadingStatus) {
                loadingStatus.textContent = '[시도 ' + attempt + '/2] 주소 검색 중... (' + (i + 1) + '/' + addressesWithData.length + ') - 성공: ' + successCount + '개';
            }
        }
        
        if (attempt === 1) {
            console.log('========== 1차 시도 완료: ' + successCount + '/' + addressesWithData.length + '개 성공 ==========');
            
            if (successCount === addressesWithData.length) {
                console.log('✅ 모든 마커가 표시되어 2차 시도 생략');
                break;
            } else {
                console.log('⚠️ ' + (addressesWithData.length - successCount) + '개 누락, 2차 시도 시작...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    console.log('========== 최종 결과: ' + successCount + '/' + addressesWithData.length + '개 마커 표시 완료 ==========');
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
    
    if (typeof renderReportTable === 'function') {
        renderReportTable();
    }

    if (coordinates.length > 0) {
        const extent = ol.extent.boundingExtent(
            coordinates.map(coord => ol.proj.fromLonLat(coord))
        );
        vworldMap.getView().fit(extent, {
            padding: [100, 100, 100, 100],
            maxZoom: 16,
            duration: 1000
        });
    }

    if (loadingStatus) {
        loadingStatus.style.display = 'block';
        loadingStatus.style.backgroundColor = successCount > 0 ? '#10b981' : '#ef4444';
        loadingStatus.textContent = '✔ 이 ' + addressesWithData.length + '개 주소 중 ' + successCount + '개를 지도에 표시했습니다.';
        setTimeout(() => { if (loadingStatus) loadingStatus.style.display = 'none'; }, 3000);
    }

    const panel = document.getElementById('markerListPanel');
    if (panel && panel.style.display !== 'none') updateMarkerList();
}

// 하단 정보창 (VWorld용)
function showBottomInfoPanelVWorld(rowData, markerIndex) {
    const sameAddressMarkers = [];
    vworldMarkers.forEach((item, index) => {
        if (item.rowData.주소 === rowData.주소) {
            sameAddressMarkers.push({ index, data: item.rowData });
        }
    });
    
    const panel = document.getElementById('bottomInfoPanel');
    if (!panel) return;
    
    const markersHtml = sameAddressMarkers.map((markerInfo) => {
        const data = markerInfo.data;
        const mIdx = markerInfo.index;
        const memos = data.메모 || [];
        
        const markerLat = data.lat || 0;
        const markerLng = data.lng || data.lon || 0;
        
        const memosHtml = memos.length > 0 
            ? memos.map((memo, i) => '<div class="text-xs text-slate-600 mb-1"><span class="font-semibold">' + (i + 1) + '.</span> ' + memo.내용 + ' <span class="text-slate-400">(' + memo.시간 + ')</span></div>').join('')
            : '<div class="text-xs text-slate-400">메모가 없습니다</div>';
        
        return '<div class="bg-white rounded-lg p-6 border-t-2 border-slate-200"><div class="mb-4 pr-8"><h3 class="text-xl font-bold text-slate-900 mb-2">' + data.순번 + '. ' + (data.이름 || '이름없음') + '</h3></div><div class="mb-4"><label class="block text-sm font-medium text-slate-700 mb-2">상태</label><div class="flex gap-2"><button onclick="changeVWorldMarkerStatus(' + mIdx + ', \'예정\')" class="px-4 py-2 rounded-lg font-medium ' + (data.상태 === '예정' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700') + '">예정</button><button onclick="changeVWorldMarkerStatus(' + mIdx + ', \'완료\')" class="px-4 py-2 rounded-lg font-medium ' + (data.상태 === '완료' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700') + '">완료</button><button onclick="changeVWorldMarkerStatus(' + mIdx + ', \'보류\')" class="px-4 py-2 rounded-lg font-medium ' + (data.상태 === '보류' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700') + '">보류</button></div></div><div><div class="flex items-center justify-between mb-2"><label class="block text-sm font-medium text-slate-700">메모</label><button onclick="openMemoModalVWorld(' + mIdx + ')" class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">+ 메모 추가</button></div><div class="bg-slate-50 rounded-lg p-4">' + memosHtml + '</div></div></div>';
    }).join('');
    
    panel.innerHTML = '<div class="bg-white rounded-t-2xl shadow-2xl max-w-4xl mx-auto relative"><button onclick="hideBottomInfoPanel()" class="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg">×</button><div class="max-h-[70vh] overflow-y-auto">' + markersHtml + '</div></div>';
    
    panel.style.display = 'block';
}