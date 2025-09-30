import streamlit as st
import pandas as pd
import streamlit.components.v1 as components

# VWorld API 키
VWORLD_KEY = "BE552462-0744-32DB-81E7-1B7317390D68"

# 세션 상태 초기화
if "project_name" not in st.session_state:
    st.session_state["project_name"] = None
if "uploaded_df" not in st.session_state:
    st.session_state["uploaded_df"] = None

# -------------------------------
# 프로젝트 이름 입력 화면
# -------------------------------
if st.session_state["project_name"] is None:
    st.title("프로젝트 생성")
    project_name = st.text_input("프로젝트 이름을 입력하세요")
    if st.button("생성") and project_name:
        st.session_state["project_name"] = project_name
        st.experimental_rerun()
    st.stop()

# -------------------------------
# 프로젝트 메인 화면
# -------------------------------
st.title(f"프로젝트: {st.session_state['project_name']}")

tab1, tab2, tab3 = st.tabs(["주소입력", "결과", "지도"])

# -------------------------------
# 주소입력 탭
# -------------------------------
with tab1:
    st.subheader("📂 주소 입력 (엑셀 업로드)")
    st.caption("엑셀 파일 업로드 (.xlsx, .xls, .csv)")

    uploaded_file = st.file_uploader("엑셀 업로드", type=["xlsx", "xls", "csv"])

    if uploaded_file is not None:
        try:
            if uploaded_file.name.endswith(".csv"):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file, engine="openpyxl")
            st.session_state["uploaded_df"] = df
            st.success("업로드 성공 ✅")
        except Exception as e:
            st.error(f"엑셀 읽기 오류: {e}")

# -------------------------------
# 결과 탭
# -------------------------------
with tab2:
    st.subheader("📊 업로드 결과")
    if st.session_state["uploaded_df"] is not None:
        st.dataframe(st.session_state["uploaded_df"])
    else:
        st.info("아직 업로드된 데이터가 없습니다.")

# -------------------------------
# 지도 탭
# -------------------------------
with tab3:
    st.subheader("🗺️ VWorld 지도")

    if st.session_state["uploaded_df"] is None:
        st.info("먼저 주소 데이터를 업로드하세요.")
    else:
        df = st.session_state["uploaded_df"]

        # 마커 JS 코드 생성
        markers_js = ""
        for idx, row in df.iterrows():
            # 실제 구현에서는 geocoding API로 좌표 변환해야 함 (여기서는 예시 좌표 고정)
            lat, lon = 37.5665 + (idx * 0.001), 126.9780 + (idx * 0.001)
            name = row.get("이름", f"마커{idx}")
            addr = row.get("주소", "주소없음")
            markers_js += f"""
                L.marker([{lat}, {lon}]).addTo(map)
                  .bindPopup("<b>{name}</b><br>{addr}");
            """

        vworld_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"/>
            <title>VWorld Map</title>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"/>
            <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
            <style>
                html, body, #map {{
                    width: 100%;
                    height: 600px;
                    margin: 0;
                    padding: 0;
                }}
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map').setView([37.5665, 126.9780], 12);

                // VWorld WMTS 타일 불러오기 (HTTPS)
                L.tileLayer('https://api.vworld.kr/req/wmts/1.0.0/{VWORLD_KEY}/Base/{{z}}/{{y}}/{{x}}.png', {{
                    maxZoom: 19,
                    attribution: "VWorld"
                }}).addTo(map);

                {markers_js}
            </script>
        </body>
        </html>
        """

        components.html(vworld_html, height=650)
