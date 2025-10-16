//------------------------------------------------------
// ✅ project-detail.js 파일이 로드되었는지 확인하는 로그
//------------------------------------------------------
console.log("✅ js/project-detail.js loaded successfully.");

//------------------------------------------------------
// ✅ 프로젝트 상세 화면 관련 함수
//------------------------------------------------------
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

//------------------------------------------------------
// ✅ 탭 전환 및 자동 실행 처리
//------------------------------------------------------
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

                if (tab === '지도') onMapTabActivated();
                if (tab === '보고서') fetchPostalCodesForReport();
            } else {
                tabBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                tabBtn.classList.add('text-slate-600', 'hover:text-slate-900');
                content.style.display = 'none';
            }
        }
    });
}

//------------------------------------------------------
// ✅ 보고서 탭: 자동 우편번호 + PNU 조회
//------------------------------------------------------
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

//------------------------------------------------------
// ✅ 공통 처리 (진행바 + 알림 포함)
//------------------------------------------------------
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

//------------------------------------------------------
// ✅ 주소 기반 VWorld + 우체국 API 통합 로직
//------------------------------------------------------
async function getAddressDetailInfo(address) {
    if (!address || address.trim() === "") return null;

    const point = await getVWorldCoord(address);
    if (!point) return null;

    const pnu = await getVWorldPNU(point.x, point.y);
    if (!pnu) return null;

    const landInfo = await getVWorldLandCharacteristics(pnu);

    // ✅ (수정됨) 우체국 API를 통해 우편번호 조회
    const zipCode = await getKakaoPostalCode(address);

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
        zipCode: zipCode || "-",
        lat: point.y,
        lon: point.x
    };

    console.log(`📍 [최종] ${address} -> 지목:${result.지목}, 면적:${result.면적}, 우편번호:${result.zipCode}`);
    return result;
}

//------------------------------------------------------
// ✅ VWorld API 보조 함수들
//------------------------------------------------------
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

function getVWorldLandCharacteristics(pnu) {
    return new Promise((resolve) => {
        $.ajax({
            type: "get", dataType: "jsonp", jsonp: "callback",
            url: "https://api.vworld.kr/ned/data/getLandCharacteristics",
            data: { key: "BE552462-0744-32DB-81E7-1B7317390D68", domain: "sharif9711.github.io", pnu: pnu, stdrYear: "2017", format: "json", numOfRows: 1, pageNo: 1 },
            success: (data) => {
                const field = data?.landCharacteristicss?.field[0];
                if (field) resolve({ lndcgrCodeNm: field.lndcgrCodeNm, lndpclAr: field.lndpclAr });
                else resolve(null);
            },
            error: () => resolve(null)
        });
    });
}

//------------------------------------------------------
// ✅ (수정됨) 우체국 API: 주소 → 우편번호
//------------------------------------------------------
function getKakaoPostalCode(address) {
    return new Promise(async (resolve) => {
        const API_KEY = "a1199b81cbb627fb81760591690282";
        const BASE_URL = "https://biz.epost.go.kr/KpostPortal/openapi2";
        const TARGET = "postNew";

        if (!address || address.trim() === "") {
            resolve(null);
            return;
        }

        try {
            const url = `${BASE_URL}?regkey=${API_KEY}&target=${TARGET}&countPerPage=1&query=${encodeURIComponent(address)}`;
            const response = await fetch(url);
            const xmlText = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            const zip = xmlDoc.querySelector("zipNo")?.textContent?.trim() || null;
            if (zip) {
                console.log(`📮 [우체국API] ${address} → ${zip}`);
                resolve(zip);
            } else {
                console.warn(`⚠️ [우체국API] ${address} → 우편번호 없음`);
                resolve(null);
            }
        } catch (error) {
            console.error("❌ [우체국API] 우편번호 조회 오류:", error);
            resolve(null);
        }
    });
}
