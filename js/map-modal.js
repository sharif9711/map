// 지도 뷰 전환 함수

function showMapView() {
    document.getElementById('normalView').style.display = 'none';
    document.getElementById('mapView').style.display = 'block';
    
    const mapType = currentProject.mapType || 'kakao';
    const parcelControl = document.getElementById('vworldParcelControl'); // ✅ 추가
    
    console.log('showMapView called, mapType:', mapType);
    
    setTimeout(() => {
        console.log('Initializing map, type:', mapType);
        
        if (mapType === 'kakao') {
            document.getElementById('kakaoMap').style.display = 'block';
            if (document.getElementById('vworldMap')) {
                document.getElementById('vworldMap').style.display = 'none';
            }
            
            // ✅ 필지 버튼 숨김 (카카오맵은 지원 안함)
            if (parcelControl) {
                parcelControl.style.display = 'none';
            }
            
            if (!kakaoMap) {
                initKakaoMap();
            } else {
                if (kakaoMap && typeof kakaoMap.relayout === 'function') {
                    kakaoMap.relayout();
                }
            }
            
            setTimeout(() => {
                if (currentProject && currentProject.data && typeof displayProjectOnKakaoMap === 'function') {
                    console.log('Auto-displaying markers on Kakao map...');
                    displayProjectOnKakaoMap(currentProject.data);
                }
            }, 500);
        } else if (mapType === 'vworld') {
            document.getElementById('kakaoMap').style.display = 'none';
            
            // ✅ 필지 버튼 표시 (VWorld만 지원)
            if (parcelControl) {
                parcelControl.style.display = 'block';
            }
            
            if (!document.getElementById('vworldMap')) {
                const mapView = document.getElementById('mapView');
                const mapContainer = mapView.querySelector('[style*="height: calc"]');
                const vworldDiv = document.createElement('div');
                vworldDiv.id = 'vworldMap';
                vworldDiv.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;';
                mapContainer.appendChild(vworldDiv);
                
                console.log('VWorld container created');
                
                setTimeout(() => {
                    initVWorldMap();
                    initParcelLayer(); // ✅ 필지 레이어 초기화
                    
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
                    
                    setTimeout(() => {
                        if (currentProject && currentProject.data && typeof displayProjectOnVWorldMap === 'function') {
                            console.log('Auto-displaying markers on VWorld map...');
                            displayProjectOnVWorldMap(currentProject.data);
                        }
                    }, 2000);
                } else {
                    // ✅ 필지 레이어 확인
                    if (!parcelLayer) {
                        initParcelLayer();
                    }
                    
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
    
    // ✅ 필지 외곽선 초기화
    if (typeof isParcelBoundaryVisible !== 'undefined' && isParcelBoundaryVisible) {
        clearParcelBoundaries();
        isParcelBoundaryVisible = false;
        const btn = document.getElementById('toggleParcelBtn');
        if (btn) {
            btn.classList.remove('bg-green-600', 'text-white');
            btn.classList.add('bg-white', 'text-slate-700');
            btn.textContent = '📐 필지외곽선';
        }
    }
}
