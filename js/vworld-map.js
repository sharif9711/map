function initVWorldMap(dataList = []) {
  const map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: `http://api.vworld.kr/req/wmts/1.0.0/BE552462-0744-32DB-81E7-1B7317390D68/Base/{z}/{y}/{x}.png`
        })
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([126.9780, 37.5665]),
      zoom: 16
    })
  });

  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  map.addLayer(vectorLayer);

  dataList.forEach(row => {
    if (row.lng && row.lat) {
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(row.lng), parseFloat(row.lat)]))
      });
      marker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.05
        })
      }));
      vectorSource.addFeature(marker);

      // 지번경계선 표시 (PNU 기반)
      if (row.pnu코드) {
        fetch(`https://api.vworld.kr/req/data?service=data&request=getfeature&data=LT_C_SPBD_BUBUN&key=BE552462-0744-32DB-81E7-1B7317390D68&geomFilter=BOX(126,37,128,39)&crs=EPSG:4326&attrFilter=pnu:like:${row.pnu코드}`)
          .then(res => res.json())
          .then(json => {
            const feature = json?.response?.result?.featureCollection?.features?.[0];
            if (feature && feature.geometry) {
              const format = new ol.format.GeoJSON();
              const polygon = format.readFeature(feature, {
                dataProjection: "EPSG:4326",
                featureProjection: map.getView().getProjection()
              });
              polygon.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({ color: "rgba(255,0,0,0.8)", width: 2 }),
                fill: new ol.style.Fill({ color: "rgba(255,0,0,0.15)" })
              }));
              vectorSource.addFeature(polygon);
            }
          });
      }
    }
  });
}
