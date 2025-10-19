// map-modal.js - 지도 뷰 전환 함수

console.log("✅ js/map-modal.js loaded successfully.");

// 지도 뷰 전환 함수
function showMapView() {
    document.getElementById('normalView').style.display = 'none';
    document.getElementById('mapView').style.display = 'block';
    
    const mapType = currentProject.mapType || 'kakao';
    
    console.log('showMapView called, mapType:', mapType);
    
    // 지도 초기화 (DOM이 렌더링될 시간을 주기 위해 setTimeout 사용)
    setTimeout(() => {
        console.log('Initializing map, type:', mapType);
        
        if (mapType === 'kakao') {
            // 카카오맵 표시, VWorld 숨기기
            document.getElementById('kakaoMap').style.display = 'block';
            const vworldMapElement = document.getElementById('vworldMap');
            if (vworldMapElement) {
                vworldMapElement.style.display = 'none';
            }
            
            if (!kakaoMap) {
                initKakaoMap();
            } else {
                // 지도가 숨겨져 있었다가 다시 보일 때 크기를 재조정해야 함
                if (typeof kakaoMap.relayout === 'function') {
                    kakaoMap.relayout();
                }
            }
            
            // 지도 초기화 후 자동으로 마커 표시
            setTimeout(() => {
                if (currentProject && currentProject.data && typeof displayProjectOnKakaoMap === 'function') {
                    console.log('Auto-displaying markers on Kakao map...');
                    displayProjectOnKakaoMap(currentProject.data);
                }
            }, 500);
        } else if (mapType === 'vworld') {
            // VWorld 표시, 카카오맵 숨기기
            document.getElementById('kakaoMap').style.display = 'none';
            
            // VWorld 지도 컨테이너가 동적으로 생성되었는지 확인
            if (!document.getElementById('vworldMap')) {
                console.log('VWorld container not found, creating...');
                // VWorld 지도 컨테이너 생성
                const mapView = document.getElementById('mapView');
                const mapContainer = mapView.querySelector('[style*="height: calc"]');
                if (mapContainer) {
                    const vworldDiv = document.createElement('div');
                    vworldDiv.id = 'vworldMap';
                    vworldDiv.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;';
                    mapContainer.appendChild(vworldDiv);
                }
                
                // 컨테이너 생성 후 지도 초기화
                setTimeout(() => {
                    initVWorldMap();
                    initParcelLayer(); // 필지 레이어 초기화
                    
                    // 지도 초기화 후 마커 표시
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            console.log('Auto-displaying markers on VWorld map...');
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 2000); // VWorld는 초기화 시간이 더 걸릴 수 있음
                }, 500);
            } else {
                // 컨테이너가 이미 존재하는 경우
                document.getElementById('vworldMap').style.display = 'block';
                
                if (!vworldMap) {
                    initVWorldMap();
                    initParcelLayer();
                    
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 2000);
                } else {
                    // 이미 지도 객체가 있는 경우
                    if (!window.parcelLayer) {
                        initParcelLayer();
                    }
                    
                    // 즉시 마커 표시
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 500);
                }
            }
        }
    }, 300); // 뷰 전환 애니메이션 후 지도 초기화
}

function hideMapView() {
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('normalView').style.display = 'block';
    
    // 뷰를 나갈 때 필지 외곽선 등을 정리하여 메모리 누수나 오류 방지
    if (typeof clearParcelBoundaries === 'function') {
        clearParcelBoundaries();
    }
}
