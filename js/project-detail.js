// ✅ 이 함수를 js/project-detail.js 파일에 추가하거나 기존 함수를 교체하세요.

/**
 * 주소로부터 PNU 코드를 포함한 상세 토지 정보를 가져오는 함수 (리팩토링 버전)
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
                // 콜백이 호출된 후 스크립트 태그를 정리합니다.
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

                // ✅ 실제 API 응답 필드에 맞춰 정보를 매핑합니다.
                const result = {
                    pnuCode: f.pnu || null,
                    bjdCode: f.pnu ? f.pnu.substring(0, 10) : null, // PNU 앞 10자리
                    대장구분: f.jibun && f.jibun.includes('대') ? '토지대장' : '임야대장',
                    본번: f.bonbun || null,
                    부번: f.bubun || null,
                    지목: null, // 이 API는 제공하지 않음
                    면적: null, // 이 API는 제공하지 않음
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
