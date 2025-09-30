import streamlit as st
import pandas as pd
import requests
import streamlit.components.v1 as components

# ===== vworld API KEY =====
VWORLD_KEY = st.secrets["VWORLD_KEY"]

# ===== 주소 → 좌표 & PNU =====
def get_coord_pnu(address, api_key=VWORLD_KEY):
    url = "https://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getcoord",
        "version": "2.0",
        "crs": "EPSG:4326",
        "address": address,
        "refine": "true",
        "simple": "false",
        "format": "json",
        "type": "parcel",   # 지번 기준
        "key": api_key
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if res.get("response", {}).get("status") == "OK":
            x = res["response"]["result"]["point"]["x"]  # 경도
            y = res["response"]["result"]["point"]["y"]  # 위도
            pnu = res["response"]["refined"]["structure"]["level4L"]
            return float(y), float(x), pnu
    except:
        return None, None, None
    return None, None, None


# ===== PNU → 필지 Polygon =====
def get_polygon_from_pnu(pnu, api_key=VWORLD_KEY):
    url = "https://api.vworld.kr/req/data"
    params = {
        "service": "data",
        "request": "GetFeature",
        "version": "2.0",
        "key": api_key,
        "format": "json",
        "size": 1,
        "page": 1,
        "geometry": "true",
        "attribute": "true",
        "crs": "EPSG:4326",
        "data": "LP_PA_CBND_BUBUN",
        "geomfilter": f"pnu:{pnu}"
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if "features" in res.get("response", {}):
            geom = res["response"]["features"][0]["geometry"]["coordinates"]
            return geom
    except:
        return None
    return None


# ===== 지도 HTML 생성 =====
def render_vworld_map(df):
    overlays_js = ""

    for idx, row in df.iterrows():
        if row.get("주소"):
            lat, lon, pnu = get_coord_pnu(row["주소"])
            if lat and lon:
                # 기본 마커
                overlays_js += f"""
                var marker = new vworld.Marker({{lon:{lon}, lat:{lat}}});
                marker.setInfoWindow("<b>{row.get('이름','')}</b><br>{row['주소']}");
                vmap.addMarker(marker);
                """

                # 필지 경계
                if pnu:
                    polygon = get_polygon_from_pnu(pnu)
                    if polygon:
                        overlays_js += f"""
                        var polygon = L.polygon({polygon}, {{
                            color: 'green',
                            weight: 2,
                            fillOpacity: 0.2
                        }}).addTo(vmap);
                        """

    vworld_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VWorld Map</title>
      <script src="https://map.vworld.kr/js/vworldMapInit.js.do?apiKey={VWORLD_KEY}"></script>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <style>
        html, body, #vmap {{
          width: 100%;
          height: 600px;
          margin: 0;
          padding: 0;
        }}
      </style>
    </head>
    <body>
      <div id="vmap"></div>
      <script>
        var vmap = new vworld.Map("vmap", "base", {{
          basemapType: "base",
          controlDensity: "full",
          navigationControl: true,
          geocodeControl: true,
          geolocationControl: true
        }});
        vmap.setCenterAndZoom(127.1087, 37.4019, 7);

        {overlays_js}
      </script>
    </body>
    </html>
    """
    components.html(vworld_html, height=650)


# ===== Streamlit 앱 구조 =====
if "page" not in st.session_state:
    st.session_state.page = "home"
if "projects" not in st.session_state:
    st.session_state.projects = []
if "current_project" not in st.session_state:
    st.session_state.current_project = None
if "addr_df" not in st.session_state:
    st.session_state.addr_df = pd.DataFrame(columns=["NO", "이름", "연락처", "주소", "비고"])


# ===== 1. 프로젝트 생성 =====
if st.session_state.page == "home":
    st.title("프로젝트 생성")
    project_name = st.text_input("프로젝트 이름을 입력하세요")
    if st.button("생성"):
        if project_name:
            st.session_state.projects.append(project_name)
            st.session_state.page = "list"
            st.success(f"프로젝트 '{project_name}' 생성 완료!")
            st.rerun()

# ===== 2. 프로젝트 목록 =====
elif st.session_state.page == "list":
    st.title("프로젝트 목록")
    if not st.session_state.projects:
        st.info("아직 생성된 프로젝트가 없습니다.")
    for i, p in enumerate(st.session_state.projects):
        if st.button(f"{p} 열기", key=f"proj_{i}"):
            st.session_state.current_project = p
            st.session_state.page = "project_view"
            st.rerun()

# ===== 3. 프로젝트 내부 =====
elif st.session_state.page == "project_view":
    st.title(f"프로젝트: {st.session_state.current_project}")

    tab1, tab2, tab3 = st.tabs(["주소입력", "결과", "지도"])

    # --- 주소입력 ---
    with tab1:
        st.subheader("📂 주소 입력 (엑셀 업로드)")
        uploaded_file = st.file_uploader("엑셀 파일 업로드 (.xlsx, .xls, .csv)", type=["xlsx", "xls", "csv"])

        if uploaded_file is not None:
            try:
                if uploaded_file.name.endswith(".csv"):
                    df = pd.read_csv(uploaded_file)
                else:
                    df = pd.read_excel(uploaded_file)

                expected_cols = ["NO", "이름", "연락처", "주소", "비고"]
                for col in expected_cols:
                    if col not in df.columns:
                        df[col] = ""
                df = df[expected_cols]

                st.session_state.addr_df = df
                st.success("엑셀 데이터 업로드 완료!")

            except Exception as e:
                st.error(f"엑셀 읽기 오류: {e}")

    # --- 결과 ---
    with tab2:
        st.subheader("📑 업로드 결과")
        if not st.session_state.addr_df.empty:
            st.dataframe(st.session_state.addr_df)
        else:
            st.info("엑셀을 먼저 업로드하세요.")

    # --- 지도 ---
    with tab3:
        st.subheader("🗺 VWorld 지도")
        if not st.session_state.addr_df.empty:
            render_vworld_map(st.session_state.addr_df)
        else:
            st.info("엑셀을 먼저 업로드하세요.")
