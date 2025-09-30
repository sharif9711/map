import streamlit as st
import pandas as pd
import requests
import folium
from streamlit_folium import st_folium
from st_aggrid import AgGrid, GridOptionsBuilder, GridUpdateMode

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

# ====== 좌표 → PNU, 지목, 면적 ======
def get_parcel_info(lat, lon, api_key=VWORLD_KEY):
    url = "http://api.vworld.kr/req/data"
    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LT_C_SPBD_PARCEL",
        "key": api_key,
        "geomFilter": f"POINT({lon} {lat})",
        "geometry": "false",
        "format": "json",
        "size": 1
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        features = res.get("response", {}).get("result", {}).get("featureCollection", {}).get("features", [])
        if features:
            props = features[0].get("properties", {})
            return props.get("pnu", ""), props.get("jibun_type", ""), props.get("area", "")
    except:
        return "", "", ""
    return "", "", ""

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

    tab1, tab2, tab3 = st.tabs(["주소입력", "결과", "지도"])

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
                st.success("엑셀 데이터 업로드 완료!")

            except Exception as e:
                st.error(f"엑셀 읽기 오류: {e}")

        # AgGrid에서 확인/편집
        if not st.session_state.addr_df.empty:
            st.markdown("### 데이터 미리보기 및 편집")
            gb = GridOptionsBuilder.from_dataframe(st.session_state.addr_df)
            gb.configure_default_column(editable=True, resizable=True)
            grid_options = gb.build()

            grid_response = AgGrid(
                st.session_state.addr_df,
                gridOptions=grid_options,
                editable=True,
                update_mode=GridUpdateMode.MODEL_CHANGED,
                height=500,
                fit_columns_on_grid_load=True,
                key="grid"
            )

            if st.button("💾 완료 (저장)", key="save_button"):
                st.session_state.addr_df = pd.DataFrame(grid_response["data"])
                st.success("주소 데이터 저장 완료!")

    # --- 결과 탭 ---
    with tab2:
        st.subheader("결과 보기 (vworld API 연동)")
        if not st.session_state.addr_df.empty:
            result_df = st.session_state.addr_df.copy()

            pnu_list, jimok_list, area_list = [], [], []
            for _, row in result_df.iterrows():
                if row.get("주소"):
                    lat, lon = get_latlon_from_address(row["주소"])
                    if lat and lon:
                        pnu, jimok, area = get_parcel_info(lat, lon)
                        pnu_list.append(pnu)
                        jimok_list.append(jimok)
                        area_list.append(area)
                    else:
                        pnu_list.append("")
                        jimok_list.append("")
                        area_list.append("")
                else:
                    pnu_list.append("")
                    jimok_list.append("")
                    area_list.append("")

            result_df["PNU코드"] = pnu_list
            result_df["지목"] = jimok_list
            result_df["면적"] = area_list

            st.dataframe(result_df, height=500, use_container_width=True)
        else:
            st.info("주소 데이터가 없습니다. 먼저 업로드하세요.")

    # --- 지도 탭 ---
    with tab3:
        st.subheader("주소 기반 지도 표시 (vworld API)")
        if not st.session_state.addr_df.empty:
            m = folium.Map(location=[37.5665, 126.9780], zoom_start=12)
            for _, row in st.session_state.addr_df.iterrows():
                if row.get("주소"):
                    lat, lon = get_latlon_from_address(row["주소"])
                    if lat and lon:
                        folium.Marker(
                            [lat, lon],
                            tooltip=f"{row['이름']} ({row['주소']})",
                            icon=folium.Icon(color="blue")
                        ).add_to(m)
            st_folium(m, width=1000, height=600)
        else:
            st.info("지도에 표시할 주소가 없습니다.")
