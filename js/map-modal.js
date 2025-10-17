// 지도 뷰 전환 함수

function showMapView() {
    document.getElementById('normalView').style.display = 'none';
    document.getElementById('mapView').style.display = 'block';
    
    const mapType = currentProject.mapType || 'kakao';
    
    console.log('showMapView called, mapType:', mapType);
    
    // 지도 초기화 (충분한 지연 시간)
    setTimeout(() => {
        console.log('Initializing map, type:', mapType);
        
        if (mapType === 'kakao') {
            // 카카오맵 표시, VWorld 숨기기
            document.getElementById('kakaoMap').style.display = 'block';
            if (document.getElementById('vworldMap')) {
                document.getElementById('vworldMap').style.display = 'none';
            }
            
            if (!kakaoMap) {
                initKakaoMap();
            } else {
                if (kakaoMap && typeof kakaoMap.relayout === 'function') {
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
            
            if (!document.getElementById('vworldMap')) {
                // VWorld 지도 컨테이너 생성
                const mapView = document.getElementById('mapView');
                const mapContainer = mapView.querySelector('[style*="height: calc"]');
                const vworldDiv = document.createElement('div');
                vworldDiv.id = 'vworldMap';
                vworldDiv.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;';
                mapContainer.appendChild(vworldDiv);
                
                console.log('VWorld container created');
                
                // 컨테이너 생성 후 지도 초기화
                setTimeout(() => {
                    initVWorldMap();
                    initParcelLayer(); // ✅ 필지 레이어 초기화
                    
                    // 지도 초기화 후 마커 표시 (시간 증가)
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            console.log('Auto-displaying markers on VWorld map...');
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 2000);
                }, 500);
            } else {
                document.getElementById('vworldMap').style.display = 'block';
                
                if (!vworldMap) {
                    initVWorldMap();
                    initParcelLayer(); // ✅ 필지 레이어 초기화
                    
                    // 지도 초기화 후 마커 표시 (시간 증가)
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            console.log('Auto-displaying markers on VWorld map...');
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 2000);
                } else {
                    // 이미 지도가 있으면 필지 레이어만 확인
                    if (!parcelLayer) {
                        initParcelLayer();
                    }
                    
                    // 즉시 마커 표시
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            console.log('Displaying markers on existing VWorld map...');
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 500);
                }
            }
        }
    }, 300);
}

function hideMapView() {
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('normalView').style.display = 'block';
    
    // 필지 외곽선 초기화 (뷰를 나갈 때 정리)
    if (typeof clearParcelBoundaries === 'function') {
        clearParcelBoundaries();
    }
}
