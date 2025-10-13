/**
 * 주소로부터 PNU 코드를 포함한 상세 토지 정보를 가져오는 함수 (그리드 서치 적용)
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

        // <<<--- 새로운 검색 함수: 좌표를 받아 필지를 찾습니다 ---<<<
        const findParcelAtPoint = (searchX, searchY) => {
            return new Promise(resolve => {
                const landCallbackName = `landCallback_${Date.now()}_${++callbackCount}`;
                createCallback(landCallbackName, (landJson) => {
                    if (landJson && landJson.response && landJson.response.status === "OK" && landJson.response.result.featureCollection.features.length > 0) {
                        resolve(landJson.response.result.featureCollection.features[0].properties);
                    } else {
                        resolve(null);
                    }
                });
                const landScript = document.createElement('script');
                landScript.id = landCallbackName;
                landScript.src = `https://api.vworld.kr/req/data?service=data&request=getfeature&format=json&size=1&page=1&data=LP_PA_CBND_BUBUN&geomFilter=POINT(${searchX} ${searchY})&key=${VWORLD_API_KEY}&callback=${landCallbackName}`;
                landScript.onerror = () => resolve(null);
                document.body.appendChild(landScript);
            });
        };

        // 최종 결과를 resolve하는 함수
        const resolveWithResult = (f, originalY, originalZip) => {
            const result = {
                pnuCode: f.pnu || null,
                bjdCode: f.pnu ? f.pnu.substring(0, 10) : null,
                대장구분: f.jibun && f.jibun.includes('대') ? '토지대장' : '임야대장',
                본번: f.bonbun || null,
                부번: f.bubun || null,
                지목: null,
                면적: null,
                우편번호: originalZip || null,
                lat: originalY,
                lon: f.lon // f에는 lon이 없으므로, 이 부분은 외부에서 처리해야 함. 일단 originalY만 사용.
            };
            resolve(result);
        };


        // 1단계: 주소 -> 좌표 변환
        const geoCallbackName = `geoCallback_${Date.now()}_${++callbackCount}`;
        createCallback(geoCallbackName, async (geoJson) => {
            if (!geoJson || !geoJson.response || geoJson.response.status !== "OK") {
                console.error("좌표 변환 실패:", address, geoJson);
                resolve(null);
                return;
            }

            const x = geoJson.response.result.point.x;
            const y = geoJson.response.result.point.y;
            const zip = geoJson.response.result.point.zip || null;

            // <<<--- 수정된 부분: 다단계 검색 로직 ---<<<
            console.log(`1단계: 원본 좌표(${x}, ${y})로 필지 검색 중... (${address})`);
            let foundParcel = await findParcelAtPoint(x, y);
            if (foundParcel) {
                console.log(`✅ 성공 (1단계): ${address} -> PNU: ${foundParcel.pnu}`);
                resolveWithResult(foundParcel, y, zip);
                return;
            }

            // 2단계: 주변 그리드 검색 (상하좌우 5미터 이동)
            console.log(`2단계: 주변 그리드 검색 시도... (${address})`);
            const delta = 0.00005; // 약 5미터에 해당하는 좌표값
            const searchGrid = [
                [x + delta, y], [x - delta, y], [x, y + delta], [x, y - delta]
            ];

            for (const [sx, sy] of searchGrid) {
                foundParcel = await findParcelAtPoint(sx, sy);
                if (foundParcel) {
                    console.log(`✅ 성공 (2단계): ${address} -> PNU: ${foundParcel.pnu}`);
                    resolveWithResult(foundParcel, y, zip);
                    return;
                }
            }

            // 3단계: 최후의 수단, 광역 사각형(Envelope) 검색
            console.log(`3단계: 최후의 수단으로 광역 검색 시도... (${address})`);
            const landCallbackName = `landCallback_final_${Date.now()}_${++callbackCount}`;
            createCallback(landCallbackName, (landJson) => {
                if (landJson && landJson.response && landJson.response.status === "OK" && landJson.response.result.featureCollection.features.length > 0) {
                    const f = landJson.response.result.featureCollection.features[0].properties;
                    console.log(`✅ 성공 (3단계): ${address} -> PNU: ${f.pnu}`);
                    resolveWithResult(f, y, zip);
                } else {
                    console.warn(`❌ 최종 실패: ${address} 주소의 토지 정보를 찾지 못했습니다.`);
                    resolve(null);
                }
            });
            const buffer = 0.0001;
            const geomFilter = `ENVELOPE(${x - buffer}, ${y - buffer}, ${x + buffer}, ${y + buffer})`;
            const landScript = document.createElement('script');
            landScript.id = landCallbackName;
            landScript.src = `https://api.vworld.kr/req/data?service=data&request=getfeature&format=json&size=10&page=1&data=LP_PA_CBND_BUBUN&geomFilter=${geomFilter}&key=${VWORLD_API_KEY}&callback=${landCallbackName}`;
            landScript.onerror = () => resolve(null);
            document.body.appendChild(landScript);
            // <<<--- 수정 끝 ---<<<
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
