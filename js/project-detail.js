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
        console.log('🔭 새로 조회할 행이 없습니다.');
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

/**
 * 주소를 기반으로 VWorld와 카카오맵 API를 통해 상세 토지 정보를 조회하는 함수
 * @param {string} address - 조회할 주소
 * @returns {Promise<object|null>} 토지 정보 객체 또는 null
 */
async function getAddressDetailInfo(address) {
    if (!address || address.trim() === "") {
        return null;
    }

    console.log(`🔍 [getAddressDetailInfo] 시작: ${address}`);

    // ✅ 1️⃣ VWorld: 주소 → 좌표 변환
    const point = await getVWorldCoord(address);
    if (!point) {
        console.warn("⚠️ VWorld 주소 변환 실패:", address);
        return null;
    }
    console.log(` - 좌표 조회 성공: (${point.x}, ${point.y})`);

    // ✅ 2️⃣ VWorld: 좌표 → PNU 코드 조회
    const pnu = await getVWorldPNU(point.x, point.y);
    if (!pnu) {
        console.warn("⚠️ PNU 코드 없음:", address);
        // PNU가 없어도 좌표는 반환 (우편번호 조회를 위해)
    } else {
        console.log(` - PNU 조회 성공: ${pnu}`);
    }

    // ✅ 3️⃣ VWorld: PNU → 토지 특성(지목, 면적) 조회
    let landInfo = null;
    if (pnu) {
        landInfo = await getVWorldLandCharacteristics(pnu);
        if (landInfo) {
            console.log(` - 토지 특성 조회 성공: 지목=${landInfo.lndcgrCodeNm}, 면적=${landInfo.lndpclAr}`);
        }
    }

    // ✅ 4️⃣ 우체국: 주소 → 우편번호 조회
    const zipCode = await getPostOfficePostalCode(address);
    if (zipCode) {
        console.log(` - 우편번호 조회 성공: ${zipCode}`);
    }

    // ✅ 5️⃣ 모든 정보 조합하여 반환
    let result = {
        zipCode: zipCode || "-",
        lat: point.y,
        lon: point.x
    };

    // PNU가 있는 경우에만 토지 정보 추가
    if (pnu) {
        const daejangMap = { "1": "토지", "2": "임야", "3": "하천", "4": "간척" };
        const daejang = daejangMap[pnu.charAt(10)] || "기타";
        const bjdCode = pnu.substring(0, 10);

        result = {
            ...result,
            pnuCode: pnu,
            법정동코드: bjdCode,
            대장구분: daejang,
            본번: pnu.substring(11, 15).replace(/^0+/, "") || "0",
            부번: pnu.substring(15, 19).replace(/^0+/, "") || "0",
            지목: landInfo?.lndcgrCodeNm || "-",
            면적: landInfo?.lndpclAr || "-"
        };
    }

    console.log(`✅ [getAddressDetailInfo] 완료:`, result);
    return result;
}

// --- 각 API를 호출하는 보조 함수들 ---

// VWorld: 주소 -> 좌표
function getVWorldCoord(address) {
    return new Promise((resolve) => {
        const requestCoord = (addr, type, callback) => {
            $.ajax({
                type: "get", 
                dataType: "jsonp", 
                jsonp: "callback",
                url: "https://api.vworld.kr/req/address",
                data: { 
                    service: "address", 
                    request: "getcoord", 
                    version: "2.0", 
                    crs: "epsg:4326", 
                    address: addr, 
                    type: type, 
                    key: "BE552462-0744-32DB-81E7-1B7317390D68" 
                },
                success: (data) => {
                    console.log(` - VWorld 좌표 조회 응답 (${type}):`, data);
                    callback(data);
                },
                error: (xhr, status, error) => {
                    console.error(` - VWorld 좌표 조회 실패 (${type}):`, error);
                    callback(null);
                }
            });
        };

        // 도로명 주소로 먼저 시도
        requestCoord(address, "ROAD", (geo) => {
            if (geo?.response?.result?.point) {
                console.log(' - 도로명 주소로 좌표 찾음');
                resolve(geo.response.result.point);
            } else {
                // 도로명 실패 시 지번 주소로 재시도
                console.log(' - 도로명 주소 실패, 지번 주소로 재시도');
                requestCoord(address, "PARCEL", (geo2) => {
                    if (geo2?.response?.result?.point) {
                        console.log(' - 지번 주소로 좌표 찾음');
                        resolve(geo2.response.result.point);
                    } else {
                        console.warn(' - 지번 주소도 실패');
                        resolve(null);
                    }
                });
            }
        });
    });
}

// VWorld: 좌표 -> PNU
function getVWorldPNU(x, y) {
    return new Promise((resolve) => {
        $.ajax({
            type: "get", 
            dataType: "jsonp", 
            jsonp: "callback",
            url: "https://api.vworld.kr/req/data",
            data: { 
                service: "data", 
                request: "getfeature", 
                format: "json", 
                data: "LP_PA_CBND_BUBUN", 
                geomFilter: `POINT(${x} ${y})`, 
                size: 1, 
                key: "BE552462-0744-32DB-81E7-1B7317390D68" 
            },
            success: (data) => {
                console.log(' - VWorld PNU 조회 응답:', data);
                const pnu = data?.response?.result?.featureCollection?.features?.[0]?.properties?.pnu;
                if (pnu) {
                    console.log(` - PNU 찾음: ${pnu}`);
                } else {
                    console.warn(' - PNU 없음');
                }
                resolve(pnu || null);
            },
            error: (xhr, status, error) => {
                console.error(' - VWorld PNU 조회 실패:', error);
                resolve(null);
            }
        });
    });
}

// VWorld: PNU -> 토지 특성
function getVWorldLandCharacteristics(pnu) {
    return new Promise((resolve) => {
        $.ajax({
            type: "get", 
            dataType: "jsonp", 
            jsonp: "callback",
            url: "https://api.vworld.kr/ned/data/getLandCharacteristics",
            data: { 
                key: "BE552462-0744-32DB-81E7-1B7317390D68", 
                domain: "sharif9711.github.io", 
                pnu: pnu, 
                stdrYear: "2017", 
                format: "json", 
                numOfRows: 1, 
                pageNo: 1 
            },
            success: (data) => {
                console.log(' - VWorld 토지특성 조회 응답:', data);
                const field = data?.landCharacteristicss?.field?.[0];
                if (field) {
                    console.log(` - 토지특성 찾음: 지목=${field.lndcgrCodeNm}, 면적=${field.lndpclAr}`);
                    resolve({ 
                        lndcgrCodeNm: field.lndcgrCodeNm, 
                        lndpclAr: field.lndpclAr 
                    });
                } else {
                    console.warn(' - 토지특성 없음');
                    resolve(null);
                }
            },
            error: (xhr, status, error) => {
                console.error(' - VWorld 토지특성 조회 실패:', error);
                resolve(null);
            }
        });
    });
}

// 우체국 우편번호 API 사용 (카카오 대신)
function getPostOfficePostalCode(address) {
    return new Promise((resolve) => {
        const API_KEY = 'a1199b81cbb627fb81760591690282';
        
        // 주소에서 검색어 추출 (시/도, 시/군/구, 동/읍/면)
        const addressParts = address.split(' ').filter(p => p.trim() !== '');
        if (addressParts.length < 2) {
            console.warn(' - 주소가 너무 짧아 우편번호 검색 불가');
            resolve(null);
            return;
        }
        
        // 처음 2-3개 단어만 사용 (예: "전남 강진군 남")
        const searchQuery = addressParts.slice(0, 3).join(' ');
        
        $.ajax({
            type: "get",
            dataType: "json",
            url: "https://business.juso.go.kr/addrlink/addrLinkApi.do",
            data: {
                confmKey: API_KEY,
                currentPage: 1,
                countPerPage: 1,
                keyword: searchQuery,
                resultType: "json"
            },
            success: (data) => {
                console.log(' - 우체국 우편번호 조회 응답:', data);
                
                if (data.results && data.results.common && data.results.common.errorCode === "0") {
                    const juso = data.results.juso;
                    if (juso && juso.length > 0) {
                        const zipCode = juso[0].zipNo;
                        console.log(` - 우편번호 찾음: ${zipCode}`);
                        resolve(zipCode);
                    } else {
                        console.warn(' - 검색 결과 없음');
                        resolve(null);
                    }
                } else {
                    console.warn(' - 우체국 API 오류:', data.results?.common?.errorMessage);
                    resolve(null);
                }
            },
            error: (xhr, status, error) => {
                console.error(' - 우체국 우편번호 조회 실패:', error);
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
    mapCount.textContent = `총 ${count}개의 주소`;
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
