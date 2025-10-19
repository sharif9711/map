// excelExport.js 내용을 여기에 통합
function downloadExcel() {
    if (!currentProject || !currentProject.data) return;

    // 실제 데이터가 입력된 행만 필터링 (이름, 연락처, 주소 중 하나라도 있으면)
    const filteredData = currentProject.data.filter(row => 
        row.이름 || row.연락처 || row.주소
    );

    if (filteredData.length === 0) {
        showToast('⚠️ 다운로드할 데이터가 없습니다.');
        return;
    }

    // id 필드 제거하고 엑셀용 데이터 생성
    const excelData = filteredData.map(row => {
        const { id, vworld_lon, vworld_lat, ...rowWithoutId } = row; // id와 내부 좌표 제거
        
        // 메모 배열을 문자열로 변환
        if (rowWithoutId.메모 && Array.isArray(rowWithoutId.메모)) {
            rowWithoutId.메모 = rowWithoutId.메모
                .map((m, i) => `${i + 1}. ${m.내용 || m.내용} (${m.시간})`)
                .join('\n');
        }
        
        return rowWithoutId;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "토지정보");

    const filename = `${currentProject.projectName || 'project'}_report.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`📄 ${excelData.length}개 행이 다운로드되었습니다.`);
}
// VWorld 지도 표시 및 프로젝트 데이터 렌더링 (개선 버전)

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
    clearParcelBoundaries(); // 필지도 초기화

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
        loadingStatus.textContent = `주소 검색 중... (0/${addressesWithData.length})`;
    }

    const coordinates = [];
    let successCount = 0;
    markerListData = [];

    for (let i = 0; i < addressesWithData.length; i++) {
        const row = addressesWithData[i];
        
        let coord = null;
        
        if (row.vworld_lon && row.vworld_lat) {
            coord = {
                lon: row.vworld_lon,
                lat: row.vworld_lat,
                address: row.주소
            };
        } else if (row.lat && row.lng) {
            coord = {
                lon: row.lng,
                lat: row.lat,
                address: row.주소,
                zipCode: row.우편번호 || ''
            };
        } else {
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
                row.이름 || `#${row.순번}`, 
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
            }
        }

        if (loadingStatus) {
            loadingStatus.textContent = `주소 검색 중... (${i + 1}/${addressesWithData.length}) - 성공: ${successCount}개`;
        }
        
        await new Promise(res => setTimeout(res, 400));
    }
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
    
    if (typeof renderReportTable === 'function') {
        renderReportTable();
    }

    // 마커 클릭 이벤트 등록
    if (!window.vworldClickListenerRegistered) {
        setupVWorldMarkerClick();
        window.vworldClickListenerRegistered = true;
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
        loadingStatus.textContent = `✔ 이 ${addressesWithData.length}개 주소 중 ${successCount}개를 지도에 표시했습니다.`;
        setTimeout(() => { if (loadingStatus) loadingStatus.style.display = 'none'; }, 3000);
    }

    const panel = document.getElementById('markerListPanel');
    if (panel && panel.style.display !== 'none') updateMarkerList();
    
    // ✅ 마커 표시 완료 후 자동으로 필지 외곽선 표시
    if (successCount > 0) {
        setTimeout(() => {
            showAllParcelBoundariesAuto();
        }, 1000);
    }
}

// 하단 정보창 (VWorld용 - 카카오맵과 동일한 형식)
function showBottomInfoPanelVWorld(rowData, markerIndex) {
    const sameAddressMarkers = [];
    vworldMarkers.forEach((item, index) => {
        if (item.rowData.주소 === rowData.주소) {
            sameAddressMarkers.push({ index, data: item.rowData });
        }
    });
    
    const panel = document.getElementById('bottomInfoPanel');
    if (!panel) return;
    
    const markersHtml = sameAddressMarkers.map((markerInfo, idx) => {
        const data = markerInfo.data;
        const mIdx = markerInfo.index;
        const memos = data.메모 || [];
        
        // 좌표 정보를 vworldMarkers에서 직접 가져오기
        let markerLat = 0;
        let markerLng = 0;
        
        if (vworldMarkers[mIdx] && vworldMarkers[mIdx].feature) {
            const geometry = vworldMarkers[mIdx].feature.getGeometry();
            if (geometry) {
                const coordinate = ol.proj.toLonLat(geometry.getCoordinates());
                markerLat = coordinate[1];
                markerLng = coordinate[0];
            }
        }
        
        // 위에서 못 가져왔으면 data에서 가져오기
        if (!markerLat || !markerLng) {
            markerLat = parseFloat(data.lat) || 0;
            markerLng = parseFloat(data.lng) || 0;
        }
        
        const memosHtml = memos.length > 0 
            ? memos.map((m, i) => `<div class="text-xs text-slate-600 mb-1"><span class="font-semibold">${i + 1}.</span> ${m.내용 || m.내용} <span class="text-slate-400">(${m.시간})</span></div>`).join('')
            : '<div class="text-xs text-slate-400">메모가 없습니다</div>';
        
        return `<div class="bg-white rounded-lg p-6 ${idx > 0 ? 'border-t-2 border-slate-200' : ''}">
            <div class="mb-4 pr-8">
                <h3 class="text-xl font-bold text-slate-900 mb-2">${data.순번}. ${data.이름 || '이름없음'}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                    <a href="tel:${data.연락처 || ''}" class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors ${!data.연락처 ? 'pointer-events-none opacity-50' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span class="underline">${data.연락처 || '-'}</span>
                    </a>
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="text-xs">${data.주소}</span>
                        <button id="naviBtn-vworld-${mIdx}" data-address="${(data.주소 || '').replace(/"/g, '&quot;')}" data-lat="${markerLat}" data-lng="${markerLng}" class="ml-2 p-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-colors ${!markerLat || !markerLng ? 'opacity-50 cursor-not-allowed' : ''}" title="카카오내비로 안내" ${!markerLat || !markerLng ? 'disabled' : ''}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-slate-700 mb-2">상태</label>
                <div class="flex gap-2">
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '예정')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '예정' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">예정</button>
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '완료')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '완료' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">완료</button>
                    <button onclick="changeVWorldMarkerStatus(${mIdx}, '보류')" class="px-4 py-2 rounded-lg font-medium transition-all ${data.상태 === '보류' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">보류</button>
                </div>
            </div>
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-slate-700">메모</label>
                    <button onclick="openMemoModalVWorld(${mIdx})" class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ 메모 추가</button>
                </div>
                <div class="bg-slate-50 rounded-lg p-4 max-h-32 overflow-y-auto">${memosHtml}</div>
            </div>
            <div class="text-xs text-slate-500 border-t pt-2 mt-2">
                <p><strong>지목:</strong> ${data.지목 || '-'}</p>
                <p><strong>면적:</strong> ${data.면적 || '-'}</p>
            </div>
        </div>`;
    }).join('');
    
    panel.innerHTML = `<div class="bg-white rounded-t-2xl shadow-2xl max-w-4xl mx-auto relative">
        <button onclick="hideBottomInfoPanel()" class="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg z-10">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ${sameAddressMarkers.length > 1 ? `<div class="bg-blue-50 px-6 py-3 border-b border-blue-100"><p class="text-sm text-blue-700 font-medium">ℹ️ 같은 주소에 ${sameAddressMarkers.length}개의 항목이 있습니다</p></div>` : ''}
        <div class="max-h-[70vh] overflow-y-auto">${markersHtml}</div>
    </div>`;
    
    panel.style.display = 'block';
    panel.style.animation = 'slideUp 0.3s ease-out';
    
    // 이벤트 리스너 등록 (HTML 생성 후)
    sameAddressMarkers.forEach((markerInfo) => {
        const mIdx = markerInfo.index;
        const naviBtn = document.getElementById(`naviBtn-vworld-${mIdx}`);
        
        if (naviBtn) {
            naviBtn.addEventListener('click', function() {
                const address = this.getAttribute('data-address');
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                
                console.log('VWorld 내비 버튼 클릭 - 주소:', address, '좌표:', lat, lng);
                openKakaoNavi(address, lat, lng);
            });
        }
    });
}
