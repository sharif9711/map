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

// ✅ 진행 게이지바 포함 전체 토지정보 자동 수집
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

    const rowsWithAddress = currentProject.data.filter(
        row => row.주소 && row.주소.trim() !== ''
    );
    if (rowsWithAddress.length === 0) return;

    // ✅ 진행창 생성
    let overlay = document.createElement('div');
    overlay.id = 'progressOverlay';
    overlay.className =
        'fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black/40 z-50';

    overlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl p-6 w-96 text-center">
            <h2 class="text-lg font-semibold mb-3 text-slate-800">토지정보 수집 중...</h2>
            <div class="w-full bg-slate-200 rounded-full h-4 mb-2 overflow-hidden">
                <div id="progressBar" class="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out" style="width: 0%;"></div>
            </div>
            <p id="progressText" class="text-sm text-slate-600">0 / ${rowsWithAddress.length}</p>
        </div>
    `;
    document.body.appendChild(overlay);

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    let processed = 0;

    for (let i = 0; i < rowsWithAddress.length; i++) {
        const row = rowsWithAddress[i];

        // 이미 수집된 항목은 스킵
        if (row.우편번호 && row.pnu코드 && row.면적 && row.지목) {
            processed++;
            const percent = Math.round((processed / rowsWithAddress.length) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${processed} / ${rowsWithAddress.length}`;
            continue;
        }

        try {
            geocoder.addressSearch(row.주소, async function (result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    if (!row.우편번호) {
                        let zipCode = '';
                        if (result[0].road_address?.zone_no) {
                            zipCode = result[0].road_address.zone_no;
                        } else if (result[0].address?.zip_code) {
                            zipCode = result[0].address.zip_code;
                        }
                        if (zipCode) row.우편번호 = zipCode;
                    }

                    if (!row.lat || !row.lng) {
                        row.lat = parseFloat(result[0].y);
                        row.lng = parseFloat(result[0].x);
                    }

                    // ✅ VWorld 상세정보 추가
                    if (typeof getAddressDetailInfo === 'function') {
                        try {
                            const detailInfo = await getAddressDetailInfo(row.주소);
                            if (detailInfo) {
                                row.법정동코드 = detailInfo.bjdCode || row.법정동코드;
                                row.pnu코드 = detailInfo.pnuCode || row.pnu코드;
                                row.대장구분 = detailInfo.대장구분 || row.대장구분;
                                row.본번 = detailInfo.본번 || row.본번;
                                row.부번 = detailInfo.부번 || row.부번;
                                row.지목 = detailInfo.jimok || row.지목;
                                row.면적 = detailInfo.area || row.면적;
                            }
                        } catch (error) {
                            console.error('VWorld API 조회 오류:', error);
                        }
                    }

                    if (typeof renderReportTable === 'function') {
                        renderReportTable();
                    }
                }

                processed++;
                const percent = Math.round((processed / rowsWithAddress.length) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${processed} / ${rowsWithAddress.length}`;

                // ✅ 모든 행 완료 시
                if (processed === rowsWithAddress.length) {
                    setTimeout(() => {
                        overlay.remove();
                        alert(`토지정보 수집 완료: ${rowsWithAddress.length}건`);
                    }, 400);
                }
            });
        } catch (error) {
            console.error('Geocoding error:', error);
        }

        // API 호출 간격 (과도한 요청 방지)
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // ✅ 프로젝트 데이터 업데이트
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
    }
}




// ✅ 주소 → 우편번호 + 법정동코드 + PNU + 지목 + 면적 전체 조회
async function getAddressDetailInfo(address) {
    const VWORLD_KEY = "BE552462-0744-32DB-81E7-1B7317390D68";

    // 1️⃣ 카카오 API로 우편번호 및 좌표 구하기
    function getKakaoAddressInfo(addr) {
        return new Promise((resolve) => {
            if (typeof kakao === "undefined" || !kakao.maps?.services) {
                resolve(null);
                return;
            }

            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(addr, (result, status) => {
                if (status === kakao.maps.services.Status.OK && result.length > 0) {
                    const item = result[0];
                    const zip =
                        (item.road_address && item.road_address.zone_no) ||
                        (item.address && item.address.zip_code) ||
                        "";
                    resolve({
                        zipCode: zip,
                        x: parseFloat(item.x),
                        y: parseFloat(item.y),
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    // 2️⃣ VWorld 주소 → 좌표 변환 (백업)
    function getVWorldCoord(addr) {
        return new Promise((resolve) => {
            $.ajax({
                url: "https://api.vworld.kr/req/address",
                dataType: "jsonp",
                data: {
                    service: "address",
                    request: "getcoord",
                    version: "2.0",
                    crs: "epsg:4326",
                    address: addr,
                    type: "road",
                    key: VWORLD_KEY,
                },
                success: function (res) {
                    if (res.response?.status === "OK") {
                        resolve({
                            zipCode: "",
                            x: parseFloat(res.response.result.point.x),
                            y: parseFloat(res.response.result.point.y),
                        });
                    } else {
                        resolve(null);
                    }
                },
                error: () => resolve(null),
            });
        });
    }

    // 3️⃣ VWorld 토지정보 조회
    function getVWorldLandInfo(x, y) {
        return new Promise((resolve) => {
            $.ajax({
                url: "https://api.vworld.kr/req/data",
                dataType: "jsonp",
                data: {
                    service: "data",
                    request: "getfeature",
                    key: VWORLD_KEY,
                    format: "json",
                    size: 1,
                    page: 1,
                    data: "LP_PA_CBND_BUBUN",
                    geomFilter: `point(${x} ${y})`,
                },
                success: function (res) {
                    if (res.response?.status === "OK") {
                        const f =
                            res.response.result.featureCollection.features[0]
                                .properties;
                        const pnu = f.pnu || "";

                        let bjdCode = "",
                            daejang = "",
                            bonbun = "",
                            bubun = "";
                        if (pnu.length >= 19) {
                            bjdCode = pnu.substring(0, 10);
                            const typeDigit = pnu.charAt(10);
                            switch (typeDigit) {
                                case "1":
                                    daejang = "토지";
                                    break;
                                case "2":
                                    daejang = "임야";
                                    break;
                                case "3":
                                    daejang = "하천";
                                    break;
                                case "4":
                                    daejang = "간척";
                                    break;
                                default:
                                    daejang = "";
                            }
                            bonbun = pnu.substring(11, 15);
                            bubun = pnu.substring(15, 19);
                        }

                        resolve({
                            pnuCode: pnu,
                            bjdCode,
                            대장구분: daejang,
                            본번: bonbun,
                            부번: bubun,
                            jimok: f.jimok || "",
                            area: f.parea
                                ? parseFloat(f.parea).toFixed(2) + "㎡"
                                : "",
                        });
                    } else {
                        resolve({
                            pnuCode: "",
                            bjdCode: "",
                            대장구분: "",
                            본번: "",
                            부번: "",
                            jimok: "",
                            area: "",
                        });
                    }
                },
                error: () =>
                    resolve({
                        pnuCode: "",
                        bjdCode: "",
                        대장구분: "",
                        본번: "",
                        부번: "",
                        jimok: "",
                        area: "",
                    }),
            });
        });
    }

    // 4️⃣ 실행 순서
    try {
        // (1) 카카오 API 먼저 시도
        let kakaoInfo = await getKakaoAddressInfo(address);
        let coord = kakaoInfo || (await getVWorldCoord(address));

        if (!coord) {
            return {
                zipCode: "",
                bjdCode: "",
                pnuCode: "",
                대장구분: "",
                본번: "",
                부번: "",
                jimok: "",
                area: "",
                lat: "",
                lon: "",
            };
        }

        // (2) VWorld 토지정보 가져오기
        const land = await getVWorldLandInfo(coord.x, coord.y);

        // (3) 통합 결과 반환
        return {
            zipCode: kakaoInfo?.zipCode || "",
            bjdCode: land.bjdCode,
            pnuCode: land.pnuCode,
            대장구분: land.대장구분,
            본번: land.본번,
            부번: land.부번,
            jimok: land.jimok,
            area: land.area,
            lat: coord.y,
            lon: coord.x,
        };
    } catch (error) {
        console.error("getAddressDetailInfo 오류:", error);
        return {
            zipCode: "",
            bjdCode: "",
            pnuCode: "",
            대장구분: "",
            본번: "",
            부번: "",
            jimok: "",
            area: "",
            lat: "",
            lon: "",
        };
    }
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
                row.지목 = detailInfo.jimok;
                row.면적 = detailInfo.area;
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

// ✅ 보고서 테이블을 제목 포함 Excel(.xlsx)로 다운로드
function downloadExcel() {
    try {
        const table = document.getElementById('reportTable');
        if (!table) {
            alert('보고서 테이블을 찾을 수 없습니다.');
            return;
        }

        // 📘 프로젝트명 + 날짜로 제목 생성
        const projectName = currentProject?.projectName || '프로젝트';
        const today = new Date().toISOString().slice(0, 10);
        const titleRow = [`${projectName} 보고서`];
        const dateRow = [`생성일자: ${today}`];

        // HTML 테이블을 배열로 변환
        const wsData = [];
        wsData.push(titleRow);
        wsData.push(dateRow);
        wsData.push([]); // 빈 줄 한 줄 추가

        // 📋 실제 보고서 테이블의 헤더 + 본문을 그대로 복사
        const headers = Array.from(table.querySelectorAll("thead th")).map(th =>
            th.textContent.trim()
        );
        wsData.push(headers);

        const rows = Array.from(table.querySelectorAll("tbody tr")).map(tr =>
            Array.from(tr.querySelectorAll("td")).map(td =>
                td.textContent.trim()
            )
        );
        wsData.push(...rows);

        // 📗 시트 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // ✅ 열 너비 자동 계산 (한글 깨짐 방지)
        const colWidths = [];
        wsData.forEach(row => {
            row.forEach((cell, i) => {
                const width = cell ? cell.toString().length + 2 : 10;
                colWidths[i] = Math.max(colWidths[i] || 10, width);
            });
        });
        ws['!cols'] = colWidths.map(w => ({ width: w }));

        // ✅ 스타일: 제목은 굵게, 가운데 정렬
        ws['A1'].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // 시트와 파일 생성
        XLSX.utils.book_append_sheet(wb, ws, '보고서');
        const fileName = `${projectName}_보고서_${today}.xlsx`;

        XLSX.writeFile(wb, fileName);
        alert(`"${fileName}" 파일이 정상적으로 다운로드되었습니다.`);
    } catch (error) {
        console.error('엑셀 다운로드 오류:', error);
        alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
}
