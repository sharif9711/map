// project-detail.js 파일이 로드되었는지 확인하는 로그
console.log("✅ js/project-detail.js loaded successfully.");

// 프로젝트 상세 화면 관련 함수

function showProjectDetail() {
    // ✅ [수정] 1. 프로젝트 상세 화면의 HTML 템플릿을 가져와 그립니다.
    const projectDetailScreen = document.getElementById('projectDetailScreen');
    if (!projectDetailScreen) {
        console.error('projectDetailScreen element not found!');
        return;
    }

    // ✅ [수정] 2. 화면이 비어있을 때만 HTML을 채워넣습니다. (불필요한 재렌더링 방지)
    if (projectDetailScreen.innerHTML.trim() === '') {
        projectDetailScreen.innerHTML = getProjectDetailHTML();
        console.log('✅ Project detail screen content loaded.');
    }

    // ✅ [수정] 3. HTML이 그려진 후, 화면 전환 및 데이터 설정을 시작합니다.
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

    // ✅ [수정] 4. 지도 유형에 따라 VWorld 전용 컨트롤을 표시/숨깁니다.
    const vworldControls = document.getElementById('vworldSpecificControls');
    if (vworldControls) {
        if (currentProject.mapType === 'kakao') {
            // 카카오맵이면 VWorld 전용 컨트롤을 숨깁니다.
            vworldControls.style.display = 'none';
        } else {
            // VWorld이면 VWorld 전용 컨트롤을 보여줍니다.
            vworldControls.style.display = 'flex';
        }
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

/**
 * 보고서 탭에서 모든 행의 주소를 기준으로
 * 우편번호 및 PNU코드 등 토지정보를 VWorld API로 조회하는 함수
 */
// ✅ 보고서 탭 자동 실행 시: PNU 없는 행만 조회
async function fetchPostalCodesForReport() {
    if (!currentProject) return;
    const targetRows = currentProject.data.filter(r =>
        r.주소 && r.주소.trim() !== '' && (!r.pnu코드 || r.pnu코드.trim() === '')
    );

    if (targetRows.length === 0) {
        console.log('📭 새로 조회할 행이 없습니다.');
        return;
    }

    await fetchLandInfoCore(targetRows);
}

// ✅ "토지정보 수집" 버튼용 함수
async function fetchLandInfoForReport() {
    if (!currentProject) return;
    const targetRows = currentProject.data.filter(r =>
        r.주소 && r.주소.trim() !== '' && (!r.pnu코드 || r.pnu코드.trim() === '')
    );

    if (targetRows.length === 0) {
        showToast('새로 조회할 행이 없습니다.');
        return;
    }

    await fetchLandInfoCore(targetRows);
}

// ✅ 공통 처리 (진행바 + 알림 포함)
async function fetchLandInfoCore(targetRows) {
    const total = targetRows.length;
    showProgress(0);

    for (let i = 0; i < total; i++) {
        const row = targetRows[i];
        try {
            const info = await getAddressDetailInfo(row.주소);
            if (info) {
                Object.assign(row, {
                    우편번호: info.zipCode || row.우편번호,
                    lat: info.lat || row.lat,
                    lng: info.lon || row.lng,
                    법정동코드: info.법정동코드 || row.법정동코드,
                    pnu코드: info.pnuCode || row.pnu코드,
                    대장구분: info.대장구분 || row.대장구분,
                    본번: info.본번 || row.본번,
                    부번: info.부번 || row.부번,
                    지목: info.지목 || row.지목,
                    면적: info.면적 || row.면적,
                });
            }
        } catch (err) {
            console.error(`❌ 오류 [${i + 1}/${total}]`, err);
        }

        showProgress(((i + 1) / total) * 100);
        await new Promise(res => setTimeout(res, 400));
    }

    showProgress(100);
    setTimeout(() => showProgress(0), 1500);

    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) projects[projectIndex] = currentProject;

    if (typeof renderReportTable === 'function') renderReportTable();
    showToast(`✅ 토지정보 ${total}건 갱신 완료`);
}


// jQuery가 반드시 로드되어 있어야 합니다.

/**
 * 주소를 기반으로 VWorld API를 통해 상세 토지 정보(좌표, PNU, 지목, 면적, 우편번호)를 조회하는 함수
 * @param {string} address - 조회할 주소
 * @returns {Promise<object|null>} 토지 정보 객체 또는 null
 */
// project-detail.js 내의 getAddressDetailInfo 함수를 이 코드로 완전히 교체하세요.

// project-detail.js 내의 getAddressDetailInfo 함수를 이 코드로 완전히 교체하세요.

/**
 * 주소를 기반으로 VWorld와 카카오맵 API를 통해 상세 토지 정보를 조회하는 함수
 * @param {string} address - 조회할 주소
 * @returns {Promise<object|null>} 토지 정보 객체 또는 null
 */
async function getAddressDetailInfo(address) {
    if (!address || address.trim() === "") {
        return null;
    }

    // ✅ 1️⃣ VWorld: 주소 → 좌표 변환
    const point = await getVWorldCoord(address);
    if (!point) {
        console.warn("⚠️ VWorld 주소 변환 실패:", address);
        return null;
    }

    // ✅ 2️⃣ VWorld: 좌표 → PNU 코드 조회
    const pnu = await getVWorldPNU(point.x, point.y);
    if (!pnu) {
        console.warn("⚠️ PNU 코드 없음:", address);
        return null;
    }

    // ✅ 3️⃣ VWorld: PNU → 토지 특성(지목, 면적) 조회
    const landInfo = await getVWorldLandCharacteristics(pnu);

    // ✅ 4️⃣ 카카오맵: 주소 → 우편번호 조회 (VWorld API는 우편번호를 제공하지 않음)
    const zipCode = await getKakaoPostalCode(address);

    // ✅ 5️⃣ 모든 정보 조합하여 반환
    const daejangMap = { "1": "토지", "2": "임야", "3": "하천", "4": "간척" };
    const daejang = daejangMap[pnu.charAt(10)] || "기타";
    const bjdCode = pnu.substring(0, 10);

    const result = {
        pnuCode: pnu,
        법정동코드: bjdCode,
        대장구분: daejang,
        본번: pnu.substring(11, 15).replace(/^0+/, "") || "0",
        부번: pnu.substring(15, 19).replace(/^0+/, "") || "0",
        지목: landInfo?.lndcgrCodeNm || "-",
        면적: landInfo?.lndpclAr || "-",
        zipCode: zipCode || "-", // ✅ 카카오맵에서 얻은 우편번호
        lat: point.y,
        lon: point.x
    };

    console.log(`📍 [최종] ${address} -> 지목:${result.지목}, 면적:${result.면적}, 우편번호:${result.zipCode}`);
    return result;
}

// --- 각 API를 호출하는 보조 함수들 ---

// VWorld: 주소 -> 좌표
function getVWorldCoord(address) {
    return new Promise((resolve) => {
        const requestCoord = (addr, type, callback) => {
            $.ajax({
                type: "get", dataType: "jsonp", jsonp: "callback",
                url: "https://api.vworld.kr/req/address",
                data: { service: "address", request: "getcoord", version: "2.0", crs: "epsg:4326", address: addr, type: type, key: "BE552462-0744-32DB-81E7-1B7317390D68" },
                success: (data) => callback(data),
                error: () => callback(null)
            });
        };

        requestCoord(address, "ROAD", (geo) => {
            if (geo?.response?.result?.point) resolve(geo.response.result.point);
            else requestCoord(address, "PARCEL", (geo2) => {
                if (geo2?.response?.result?.point) resolve(geo2.response.result.point);
                else resolve(null);
            });
        });
    });
}

// VWorld: 좌표 -> PNU
function getVWorldPNU(x, y) {
    return new Promise((resolve) => {
        $.ajax({
            type: "get", dataType: "jsonp", jsonp: "callback",
            url: "https://api.vworld.kr/req/data",
            data: { service: "data", request: "getfeature", format: "json", data: "LP_PA_CBND_BUBUN", geomFilter: `POINT(${x} ${y})`, size: 1, key: "BE552462-0744-32DB-81E7-1B7317390D68" },
            success: (data) => {
                const pnu = data?.response?.result?.featureCollection?.features?.[0]?.properties?.pnu;
                resolve(pnu || null);
            },
            error: () => resolve(null)
        });
    });
}

// VWorld: PNU -> 토지 특성
function getVWorldLandCharacteristics(pnu) {
    return new Promise((resolve) => {
        $.ajax({
            type: "get", dataType: "jsonp", jsonp: "callback",
            url: "https://api.vworld.kr/ned/data/getLandCharacteristics",
            data: { key: "BE552462-0744-32DB-81E7-1B7317390D68", domain: "sharif9711.github.io", pnu: pnu, stdrYear: new Date().getFullYear(), format: "json", numOfRows: 1, pageNo: 1 },
            success: (data) => {
                const field = data?.landCharacteristicss?.field[0];
                if (field) resolve({ lndcgrCodeNm: field.lndcgrCodeNm, lndpclAr: field.lndpclAr });
                else resolve(null);
            },
            error: () => resolve(null)
        });
    });
}

// 카카오맵: 주소 -> 우편번호
// project-detail.js 내의 getKakaoPostalCode 함수만 이 코드로 교체하세요.

// 카카오맵: 주소 -> 우편번호
function getKakaoPostalCode(address) {
    return new Promise((resolve) => {
        // 1️⃣ 카카오맵 API가 로드되었는지 확인
        if (typeof kakao === 'undefined' || typeof kakao.maps === 'undefined' || typeof kakao.maps.services === 'undefined') {
            console.warn("Kakao Maps API is not loaded. Cannot fetch postal code.");
            resolve(null);
            return;
        }

        // 2️⃣ Geocoder 객체가 없으면 새로 생성 (이 부분이 핵심!)
        if (!window.kakaoGeocoder) {
            window.kakaoGeocoder = new kakao.maps.services.Geocoder();
        }

        // 3️⃣ 주소 검색 실행
        window.kakaoGeocoder.addressSearch(address, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
                const zip = result[0].road_address?.zone_no || result[0].address?.zip_code;
                resolve(zip || null);
            } else {
                console.warn(`Kakao address search failed for "${address}" with status:`, status);
                resolve(null);
            }
        });
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
            const pnu = row.pnu코드 || '';
            const 법정동코드 = row.법정동코드 || (pnu ? pnu.substring(0, 10) : '-');
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
                <td class="border border-slate-300 px-3 py-2 text-center">${법정동코드}</td>
                <td class="border border-slate-300 px-3 py-2 text-center">${pnu || '-'}</td>
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
            // ✅ 이 함수도 VWorld 통합 로직을 사용합니다.
            const detailInfo = await getAddressDetailInfo(row.주소);
            if (detailInfo) {
                row.우편번호 = detailInfo.zipCode || row.우편번호;
                row.pnu코드 = detailInfo.pnuCode || row.pnu코드;
                row.법정동코드 = detailInfo.법정동코드 || 
                                 (detailInfo.pnuCode ? detailInfo.pnuCode.substring(0, 10) : row.법정동코드);
                row.대장구분 = detailInfo.대장구분 || row.대장구분;
                row.본번 = detailInfo.본번 || row.본번;
                row.부번 = detailInfo.부번 || row.부번;
                row.지목 = detailInfo.지목 || row.지목;
                row.면적 = detailInfo.면적 || row.면적;
                row.lat = detailInfo.lat || row.lat;
                row.lng = detailInfo.lon || row.lng;
                successCount++;
            }
        } catch (error) {
            console.error('토지정보 수집 오류:', error);
        }

        loadingMsg.textContent = `토지정보 수집 중... (${i + 1}/${rowsWithAddress.length})`;
        await new Promise(resolve => setTimeout(resolve, 800));
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
// ✅ getAddressDetailInfo 함수 끝
