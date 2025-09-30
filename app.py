import streamlit as st
import pandas as pd
import requests
import streamlit.components.v1 as components

VWORLD_KEY = st.secrets["VWORLD_KEY"]

# ===== 주소 → 좌표 변환 함수 =====
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

# ===== 지도 표시 =====
def render_vworld_map(df):
    coords = []
    for _, row in df.iterrows():
        if row.get("주소"):
            lat, lon = get_latlon_from_address(row["주소"])
            if lat and lon:
                coords.append({"lat": lat, "lon": lon, "name": row.get("이름", ""), "addr": row["주소"]})

    # 좌표 JS 배열로 변환
    markers_js = ""
    for c in coords:
        markers_js += f"""
        var marker = new vworld.Marker({{lon:{c['lon']}, lat:{c['lat']}}});
        marker.setInfoWindow("<b>{c['name']}</b><br>{c['addr']}");
        vmap.addMarker(marker);
        """

    vworld_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VWorld Map</title>
      <script src="http://map.vworld.kr/js/vworldMapInit.js.do?apiKey={VWORLD_KEY}"></script>
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

        {markers_js}  // 업로드된 주소 마커 추가
      </script>
    </body>
    </html>
    """

    components.html(vworld_html, height=650)


# ===== Streamlit 화면 =====
st.title("📍 VWorld 지도 프로젝트")

uploaded_file = st.file_uploader("엑셀 파일 업로드 (.xlsx, .csv)", type=["xlsx", "csv"])
if uploaded_file:
    if uploaded_file.name.endswith(".csv"):
        df = pd.read_csv(uploaded_file)
    else:
        df = pd.read_excel(uploaded_file)

    st.success("엑셀 업로드 완료! 지도에 마커를 표시합니다.")
    render_vworld_map(df)
