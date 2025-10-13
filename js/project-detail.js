// project-detail.js 파일이 로드되었는지 확인하는 로그
console.log("✅ js/project-detail.js loaded successfully.");

// 프로젝트 상세 화면 관련 함수

function showProjectDetail() {
    document.getElementById('projectListScreen').classList.remove('active');
    document.getElementById('projectDetailScreen').classList.add('active');
    document.getElementById('currentProjectName').textContent = currentProject.projectName;
    
    const mapBtn = document.getElementById('mapViewButton');
    if (mapBtn) {
        const mapTypeText = currentProject.mapType === 'vworld' ? 'VWorld' : '카카오맵';
        mapBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            지도 (${mapTypeText})
        `;
    }
    
    switchTab('자료입력');
    renderDataInputTable();
    renderReportTable();
    updateMapCount();
}

function backToList() {
    document.getElementById('projectDetailScreen').classList.remove('active');
    document.getElementById('projectListScreen').classList.add('active');
    currentProject = null;
}

function switchTab(tabName) {
    const tabs = ['자료입력', '보고서', '지도', '연결'];
    tabs.forEach(tab => {
        const tabBtn = document.getElementById('tab-' + tab);
        const content = document.getElementById('content-' + tab);
        
        if (tabBtn && content) {
            if (tab === tabName) {
                tabBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                tabBtn.classList.remove('text-slate-600', 'hover:text-slate-900');
                content.style.display = 'block';
                
                if (tab === '지도') {
                    onMapTabActivated();
                }
                
                if (tab === '보고서') {
                    fetchPostalCodesForReport();
                }
            } else {
                tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                tabBtn.classList.add('text-slate-600', 'hover:text-slate-900');
                content.style.display = 'none';
            }
        }
    });
}

async function fetchPostalCodesForReport() {
    if (!currentProject) return;
    
    if (typeof kakao === 'undefined' || typeof kakao.maps === 'undefined') {
        console.log('Kakao Maps API not loaded yet');
        return;
    }
    
    if (!geocoder) {
        try {
            geocoder = new kakao.maps.services.Geocoder();
        } catch (error) {
            console.error('Failed to initialize geocoder:', error);
            return;
        }
    }
    
    const rowsWithAddress = currentProject.data.filter(row => 
        row.주소 && row.주소.trim() !== ''
    );
    
    if (rowsWithAddress.length === 0) return;
    
    for (let i = 0; i < Math.min(rowsWithAddress.length, 10); i++) {
        const row = rowsWithAddress[i];
        
        try {
            geocoder.addressSearch(row.주소, async function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    if (!row.우편번호) {
                        let zipCode = '';
                        if (result[0].road_address && result[0].road_address.zone_no) {
                            zipCode = result[0].road_address.zone_no;
                        } else if (result[0].address && result[0].address.zip_code) {
                            zipCode = result[0].address.zip_code;
                        }
                        if (zipCode) row.우편번호 = zipCode;
                    }
                    
                    if (!row.lat || !row.lng) {
                        row.lat = parseFloat(result[0].y);
                        row.lng = parseFloat(result[0].x);
                    }
                    
                    const detailInfo = await getAddressDetailInfo(row.주소);
                    if (detailInfo) {
                        row.법정동코드 = detailInfo.bjdCode || row.법정동코드;
                        row.pnu코드 = detailInfo.pnuCode || row.pnu코드;
                        row.대장구분 = detailInfo.대장구분 || row.대장구분;
                        row.본번 = detailInfo.본번 || row.본번;
                        row.부번 = detailInfo.부번 || row.부번;
                        row.지목 = detailInfo.지목 || row.지목;
                        row.면적 = detailInfo.면적 || row.면적;
                    }

                    if (typeof renderReportTable === 'function') {
                        renderReportTable();
                    }
                }
            });
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
}

// ===================================================================
// PNU 코드를 가져오는 핵심 함수 (리팩토링 버전)
// ===================================================================

/**
 * 주소로부터 PNU 코드를 포함한 상세 토지 정보를 가져오는 함수
 * @param {string} address - 검색할 주소
 * @returns {Promise<object|null>} 토지 정보 객체 또는 null
 */
function getAddressDetailInfo(address) {
    return new Promise((resolve, reject) => {
        if (!address || address.trim() === '') {
            resolve(null);
            return;
        }

        const VWORLD_API_KEY = 'BE552462-0744-32DB-81E7-1B7317390D68';
        let callbackCount = 0;

        // JSONP 콜백 함수를 동적으로 생성합니다.
        const createCallback = (callbackName, successHandler) => {
            window[callbackName] = (data) => {
                const script = document.getElementById(callbackName);
                if (script) script.remove();
                delete window[callbackName];
                successHandler(data);
            };
        };

        // 1단계: 주소 -> 좌표 변환
        const geoCallbackName = `geoCallback_${Date.now()}_${++callbackCount}`;
        createCallback(geoCallbackName, (geoJson) => {
            if (!geoJson || !geoJson.response || geoJson.response.status !== "OK") {
                console.error("좌표 변환 실패:", address, geoJson);
                resolve(null);
                return;
            }

            const x = geoJson.response.result.point.x;
            const y = geoJson.response.result.point.y;

            // 2단계: 좌표 -> 토지정보 조회
            const landCallbackName = `landCallback_${Date.now()}_${++callbackCount}`;
            createCallback(landCallbackName, (landJson) => {
                if (!landJson || !landJson.response || landJson.response.status !== "OK" || !landJson.response.result.featureCollection.features.length) {
                    console.error("토지정보 조회 실패:", address, landJson);
                    resolve(null);
                    return;
                }

                const f = landJson.response.result.featureCollection.features[0].properties;

                const result = {
                    pnuCode: f.pnu || null,
                    bjdCode: f.pnu ? f.pnu.substring(0, 10) : null,
                    대장구분: f.jibun && f.jibun.includes('대') ? '토지대장' : '임야대장',
                    본번: f.bonbun || null,
                    부번: f.bubun || null,
                    지목: null,
                    면적: null,
                    우편번호: geoJson.response.result.point.zip || null,
                    lat: y,
                    lon: x
                };
                resolve(result);
            });

            const landScript = document.createElement('script');
            landScript.id = landCallbackName;
            landScript.src = `https://api.vworld.kr/req/data?service=data&request=getfeature&format=json&size=1&page=1&data=LP_PA_CBND_BUBUN&geomFilter=POINT(${x} ${y})&key=${VWORLD_API_KEY}&callback=${landCallbackName}`;
            landScript.onerror = () => {
                console.error("토지정보 스크립트 로드 실패");
                resolve(null);
            };
            document.body.appendChild(landScript);
        });

        const geoScript = document.createElement('script');
        geoScript.id = geoCallbackName;
        geoScript.src = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodeURIComponent(address)}&type=road&key=${VWORLD_API_KEY}&callback=${geoCallbackName}`;
        geoScript.onerror = () => {
            console.error("좌표 변환 스크립트 로드 실패");
            resolve(null);
        };
        document.body.appendChild(geoScript);
    });
}

function renderDataInputTable() {
    const tbody = document.getElementById('dataInputTable');
    if (!tbody) return;
    
    tbody.innerHTML = currentProject.data.map((row, index) => `
        <tr class="hover:bg-slate-50">
            <td class="border border-slate-300 px-4 py-2 text-center text-sm">${row.순번}</td>
            <td class="border border-slate-300 px-2 py-1">
                <input type="text" value="${row.이름}" 
                    onchange="updateCellAndRefresh('${row.id}', '이름', this.value)"
                    onpaste="handlePaste(event, ${index}, '이름')"
                    class="w-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            </td>
            <td class="border border-slate-300 px-2 py-1">
                <input type="text" value="${row.연락처}"
                    onchange="updateCellAndRefresh('${row.id}', '연락처', this.value)"
                    onpaste="handlePaste(event, ${index}, '연락처')"
                    class="w-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            </td>
            <td class="border border-slate-300 px-2 py-1">
                <input type="text" value="${row.주소}"
                    onchange="updateCellAndRefresh('${row.id}', '주소', this.value)"
                    onpaste="handlePaste(event, ${index}, '주소')"
                    class="w-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            </td>
        </tr>
    `).join('');
}

function getStatusColor(status) {
    switch(status) {
        case '예정': return 'bg-blue-50 text-blue-700';
        case '완료': return 'bg-green-50 text-green-700';
        case '보류': return 'bg-amber-50 text-amber-700';
        default: return 'bg-slate-50 text-slate-700';
    }
}

function renderReportTable() {
    const tbody = document.getElementById('reportTable');
    if (!tbody) return;
    
    tbody.innerHTML = currentProject.data
        .filter(row => row.이름 || row.연락처 || row.주소)
        .map(row => {
            const 본번 = row.본번 ? String(row.본번).padStart(4, '0') : '0000';
            const 부번 = row.부번 ? String(row.부번).padStart(4, '0') : '0000';
            
            return `
            <tr class="hover:bg-slate-50">
                <td class="border border-slate-300 px-3 py-2 text-center">${row.순번}</td>
                <td class="border border-slate-300 px-3 py-2">${row.이름}</td>
                <td class="border border-slate-300 px-3 py-2">${row.연락처}</td>
                <td class="border border-slate-300 px-3 py-2">${row.주소}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.우편번호 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">
                    <select onchange="updateReportStatus('${row.id}', this.value)" 
                        class="px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.상태)} border-0 cursor-pointer">
                        <option value="예정" ${row.상태 === '예정' ? 'selected' : ''}>예정</option>
                        <option value="완료" ${row.상태 === '완료' ? 'selected' : ''}>완료</option>
                        <option value="보류" ${row.상태 === '보류' ? 'selected' : ''}>보류</option>
                    </select>
                </td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.법정동코드 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.pnu코드 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.대장구분 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${본번}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${부번}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.지목 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${row.면적 || '-'}</td>
                <td class="border border-slate-300 px-3 py-2 whitespace-pre-line">${row.기록사항 || '-'}</td>
            </tr>
            `;
        }).join('');
}

function updateReportStatus(rowId, status) {
    if (updateCell(rowId, '상태', status)) {
        renderReportTable();
    }
}

function updateMapCount() {
    const mapCount = document.getElementById('mapAddressCount');
    if (!mapCount) return;
    
    const count = currentProject.data.filter(row => row.주소).length;
    mapCount.textContent = `이 ${count}개의 주소`;
}

function updateCellAndRefresh(rowId, field, value) {
    if (updateCell(rowId, field, value)) {
        renderReportTable();
        updateMapCount();
    }
}

function handlePaste(event, rowIndex, field) {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    processPasteData(pastedText, rowIndex, field);
    renderDataInputTable();
    renderReportTable();
    updateMapCount();
}

async function fetchLandInfoForReport() {
    if (!currentProject) {
        alert('프로젝트가 선택되지 않았습니다.');
        return;
    }
    
    const rowsWithAddress = currentProject.data.filter(row => 
        row.주소 && row.주소.trim() !== '' && (row.이름 || row.연락처)
    );
    
    if (rowsWithAddress.length === 0) {
        alert('주소가 입력된 데이터가 없습니다.');
        return;
    }
    
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'landInfoLoading';
    loadingMsg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg';
    loadingMsg.textContent = '토지정보 수집 중... (0/' + rowsWithAddress.length + ')';
    document.body.appendChild(loadingMsg);
    
    let successCount = 0;
    
    for (let i = 0; i < rowsWithAddress.length; i++) {
        const row = rowsWithAddress[i];
        
        try {
            const detailInfo = await getAddressDetailInfo(row.주소);
            if (detailInfo) {
                row.우편번호 = detailInfo.zipCode;
                row.법정동코드 = detailInfo.bjdCode;
                row.pnu코드 = detailInfo.pnuCode;
                row.대장구분 = detailInfo.대장구분;
                row.본번 = detailInfo.본번;
                row.부번 = detailInfo.부번;
                row.지목 = detailInfo.지목;
                row.면적 = detailInfo.면적;
                row.lat = detailInfo.lat;
                row.lng = detailInfo.lon;
                successCount++;
            }
        } catch (error) {
            console.error('토지정보 수집 오류:', error);
        }
        
        loadingMsg.textContent = `토지정보 수집 중... (${i + 1}/${rowsWithAddress.length})`;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
    
    renderReportTable();
    
    document.body.removeChild(loadingMsg);
    
    if (successCount > 0) {
        alert(`토지정보 수집 완료: ${successCount}건`);
    } else {
        alert('토지정보를 수집하지 못했습니다.');
    }
}
