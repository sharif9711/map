import streamlit as st
import pandas as pd
import requests
import streamlit.components.v1 as components

# ===== vworld API KEY =====
VWORLD_KEY = st.secrets["VWORLD_KEY"]

# ===== 주소 → 좌표 & PNU =====
def get_coord_pnu(address, api_key=VWORLD_KEY):
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
        "type": "parcel",   # 지번 주소 기준
        "key": api_key
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if res.get("response", {}).get("status") == "OK":
            x = res["response"]["result"]["point"]["x"]  # 경도
            y = res["response"]["result"]["point"]["y"]  # 위도
            pnu = res["response"]["refined"]["structure"]["level4L"]  # PNU 코드
            return float(y), float(x), pnu
    except:
        return None, None, None
    return None, None, None


# ===== PNU → 필지 외곽 =====
def get_polygon_from_pnu(pnu, api_key=VWORLD_KEY):
    url = "http://api.vworld.kr/req/data"
    params = {
        "service": "data",
        "request": "GetFeature",
        "version": "2.0",
        "key": api_key,
        "format": "json",
        "size": 100,
        "page": 1,
        "geometry": "true",
        "attribute": "true",
        "crs": "EPSG:4326",
        "data": "LT_C_ADSIDO_INFO",  # 행정경계 레이어 (필지는 다른 데이터셋 필요시 교체)
        "geomfilter": f"pnu:{pnu}"
    }
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if "features" in res["response"]:
            geom = res["response"]["features"][0]["geometry"]["coordinates"]
            return geom
    except:
        return None
    return None


# ===== 지도 HTML 생성 =====
def render_vworld_map(df):
    markers_js = ""
    polygons_js = ""

    for idx, row in df.iterrows():
        if row.get("주소"):
            lat, lon, pnu = get_coord_pnu(row["주소"])
            if lat and lon:
                # 마커 (숫자 들어간 아이콘)
                markers_js += f"""
                var markerIcon = L.divIcon({{
                    className: 'custom-div-icon',
                    html: "<div style='background-color:#4CAF50;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;'>{idx+1}</div>",
                    iconSize: [30,30],
                    iconAnchor: [15,15]
                }});
                var marker = L.marker([{lat}, {lon}], {{icon: markerIcon}})
                    .bindPopup("<b>{row.get('이름','')}</b><br>{row['주소']}");
                vmap.addLayer(marker);
                """

                # 필지 외곽 (가능하면 PNU 활용)
                if pnu:
                    poly = get_polygon_from_pnu(pnu)
                    if poly:
                        polygons_js += f"""
                        var polygon = L.polygon({poly}, {{
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
      <script src="http://map.vworld.kr/js/vworldMapInit.js.do?apiKey={VWORLD_KEY}"></script>
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

        {markers_js}
        {polygons_js}
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

    st.success("엑셀 업로드 완료! 지도에 마커와 외곽을 표시합니다.")
    render_vworld_map(df)
