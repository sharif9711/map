// project-detail.js - switchTab 함수 수정

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
                
                // ✅ 보고서 탭 클릭 시 자동 처리
                if (tab === '보고서') {
                    console.log('📊 보고서 탭 활성화');
                    
                    // VWorld 프로젝트인 경우에만 면적 계산
                    if (currentProject && currentProject.mapType === 'vworld') {
                        console.log('🗺️ VWorld 프로젝트 - 면적 계산 시작');
                        
                        // 1. 토지정보 수집 (PNU 없는 것만)
                        fetchPostalCodesForReport();
                        
                        // 2. 면적 계산 (vworldMarkers가 있는 경우)
                        setTimeout(() => {
                            if (typeof vworldMarkers !== 'undefined' && vworldMarkers.length > 0) {
                                console.log(`✅ ${vworldMarkers.length}개 마커 발견 - 면적 계산 시작`);
                                
                                if (typeof showAllParcelBoundariesAuto === 'function') {
                                    showAllParcelBoundariesAuto();
                                    
                                    // 면적 계산 완료 후 테이블 갱신
                                    setTimeout(() => {
                                        if (typeof renderReportTable === 'function') {
                                            renderReportTable();
                                            console.log('✅ 보고서 테이블 갱신 완료');
                                        }
                                    }, vworldMarkers.length * 500); // 마커 개수 * 500ms
                                } else {
                                    console.warn('⚠️ showAllParcelBoundariesAuto 함수를 찾을 수 없습니다');
                                }
                            } else {
                                console.log('ℹ️ 표시된 마커가 없습니다. 먼저 "지도" 탭에서 주소를 표시하세요.');
                            }
                        }, 1000);
                    } else {
                        // 카카오맵 프로젝트는 기존대로
                        fetchPostalCodesForReport();
                    }
                }
            } else {
                tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                tabBtn.classList.add('text-slate-600', 'hover:text-slate-900');
                content.style.display = 'none';
            }
        }
    });
}

// 기존 함수들 유지...
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
            
            const 대장면적 = row.면적 || '-';
            const 계산면적 = row.계산면적 || '-';

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
                <td class="border border-slate-300 px-3 py-2 text-center">${대장면적}</td>
                <td class="border border-slate-300 px-3 py-2 text-center bg-blue-50 font-semibold text-blue-600">${계산면적}</td>
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

// fetchPostalCodesForReport 등 나머지 함수들은 기존과 동일...
async function fetchPostalCodesForReport() {
    if (!currentProject) return;
    const targetRows = currentProject.data.filter(r =>
        r.주소 && r.주소.trim() !== '' && (!r.pnu코드 || r.pnu코드.trim() === '')
    );

    if (targetRows.length === 0) {
        console.log('🔍 새로 조회할 행이 없습니다.');
        return;
    }

    await fetchLandInfoCore(targetRows);
}

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
