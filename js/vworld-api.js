const VWORLD_KEY = "BE552462-0744-32DB-81E7-1B7317390D68";

async function getLandInfo(addr) {
  const postal = await getPostalCode(addr);
  const api = `https://api.vworld.kr/req/data?key=${VWORLD_KEY}&service=data&request=getfeature&data=LT_C_ADSIDO_INFO&format=json&geomFilter=point(127.1 37.5)&size=1`;
  const res = await fetch(api);
  const data = await res.json();

  return {
    우편번호: postal || "",
    법정동코드: data.response?.result?.feature?.[0]?.properties?.bjd_cd || "",
    pnu코드: data.response?.result?.feature?.[0]?.properties?.pnu || "",
    지목: data.response?.result?.feature?.[0]?.properties?.jimok || "",
    면적: data.response?.result?.feature?.[0]?.properties?.area || ""
  };
}

async function getPostalCode(addr) {
  let zip = "";

  // 카카오 (도로명 + 지번)
  try {
    const geocoder = new kakao.maps.services.Geocoder();
    const result = await new Promise((resolve, reject) => {
      geocoder.addressSearch(addr, (res, status) => {
        if (status === kakao.maps.services.Status.OK) resolve(res[0]);
        else reject();
      });
    });

    if (result.road_address?.zone_no) return result.road_address.zone_no;
    if (result.address?.zip_code) return result.address.zip_code;
  } catch {}

  // VWorld
  try {
    const res = await fetch(
      `https://api.vworld.kr/req/address?service=address&request=getAddress&key=${VWORLD_KEY}&type=PARCEL&address=${encodeURIComponent(addr)}`
    );
    const data = await res.json();
    const zipCandidate = data?.response?.result?.[0]?.structure?.level4L?.zipCode;
    if (zipCandidate) return zipCandidate;
  } catch {}

  // 행정안전부 백업
  try {
    const res = await fetch(
      `https://www.juso.go.kr/addrlink/addrLinkApi.do?confmKey=YOUR_KEY_HERE&currentPage=1&countPerPage=5&keyword=${encodeURIComponent(addr)}`
    );
    const text = await res.text();
    const match = text.match(/<zipNo>(\d{5})<\/zipNo>/);
    if (match) return match[1];
  } catch {}

  return zip;
}
