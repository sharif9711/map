import streamlit as st
import pandas as pd
import requests
import folium
from streamlit_folium import st_folium

# ====== 페이지 와이드 모드 ======
st.set_page_config(page_title="지도 프로젝트", layout="wide")

# ====== vworld API Key (Secrets) ======
VWORLD_KEY = st.secrets["VWORLD_KEY"]

# ====== 주소 → 좌표 변환 ======
def get_latlon_from_address(address, api_key=VWORLD_KEY):
    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getcoord",
        "version": "2.0",
        "crs": "EPSG:4326",
        "address": address,
        "refine": "true",
        "simple": "false",
        "format": "json",
        "type": "road",
        "key": api_key
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if res.get("response", {}).get("status") == "OK":
            x = res["response"]["result"]["point"]["x"]  # 경도
            y = res["response"]["result"]["point"]["y"]  # 위도
            return float(y), float(x)
    except:
        return None, None
    return None, None

# ====== Session 초기화 ======
if "page" not in st.session_state:
    st.session_state.page = "home"
if "projects" not in st.session_state:
    st.session_state.projects = []
if "current_project" not in st.session_state:
    st.session_state.current_project = None
if "addr_df" not in st.session_state:
    st.session_state.addr_df = pd.DataFrame(columns=["NO", "이름", "연락처", "주소", "비고"])

# ====== Home 화면 (프로젝트 생성) ======
if st.session_state.page == "home":
    st.title("프로젝트 생성")
    project_name = st.text_input("프로젝트 이름을 입력하세요")
    if st.button("생성"):
        if project_name:
            st.session_state.projects.append(project_name)
            st.session_state.page = "list"
            st.success(f"프로젝트 '{project_name}' 생성 완료!")
            st.rerun()

# ====== 프로젝트 목록 ======
elif st.session_state.page == "list":
    st.title("프로젝트 목록")
    if not st.session_state.projects:
        st.info("아직 생성된 프로젝트가 없습니다.")
    for i, p in enumerate(st.session_state.projects):
        if st.button(f"{p} 열기", key=f"proj_{i}"):
            st.session_state.current_project = p
            st.session_state.page = "project_view"
            st.rerun()

# ====== 프로젝트 내부 ======
elif st.session_state.page == "project_view":
    st.title(f"프로젝트: {st.session_state.current_project}")

    tab1, tab2 = st.tabs(["주소입력", "지도"])

    # --- 주소 입력 탭 ---
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
                df = df[expected_cols]  # 순서 맞춤

                st.session_state.addr_df = df
                st.success("엑셀 데이터 업로드 완료! 지도 탭에서 확인하세요.")

            except Exception as e:
                st.error(f"엑셀 읽기 오류: {e}")

    # --- 지도 탭 ---
    with tab2:
        st.subheader("주소 기반 지도 표시 (vworld API)")
        if not st.session_state.addr_df.empty:
            m = folium.Map(location=[37.5665, 126.9780], zoom_start=12)

            for _, row in st.session_state.addr_df.iterrows():
                if row.get("주소"):
                    lat, lon = get_latlon_from_address(row["주소"])
                    if lat and lon:
                        folium.Marker(
                            [lat, lon],
                            tooltip=f"{row['이름']} - {row['주소']}",
                            icon=folium.Icon(color="blue")
                        ).add_to(m)

            st_folium(m, width=1000, height=600)
        else:
            st.info("엑셀을 먼저 업로드하세요.")
