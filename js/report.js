document.getElementById("reportTab")?.addEventListener("click", () => {
  if (!window.isCollected) {
    window.isCollected = true;
    autoCollectLandInfo();
  }
});

async function autoCollectLandInfo() {
  const rows = document.querySelectorAll("#reportTable tbody tr");
  const total = rows.length;
  let completed = 0;

  const bar = document.getElementById("progressBar");
  const container = document.getElementById("progressContainer");
  const text = document.getElementById("progressText");
  const excelBtn = document.getElementById("excelDownloadBtn");
  const collectBtn = document.getElementById("collectLandInfoBtn");

  container.classList.remove("hidden");
  text.textContent = `토지정보 수집 중... (0 / ${total})`;
  bar.style.width = "0%";
  bar.classList.remove("bg-green-500");
  bar.classList.add("bg-blue-500");

  excelBtn.disabled = true;
  collectBtn.disabled = true;
  collectBtn.classList.add("opacity-50", "cursor-not-allowed");

  for (const row of rows) {
    const addr = row.querySelector(".address-cell")?.textContent.trim();
    if (!addr) continue;

    try {
      const info = await getLandInfo(addr);
      if (info) fillRowData(row, info);
    } catch (e) {
      console.warn("토지정보 조회 실패:", addr);
    }

    completed++;
    const percent = Math.round((completed / total) * 100);
    bar.style.width = `${percent}%`;
    text.textContent = `토지정보 수집 중... (${completed} / ${total})`;

    await new Promise(r => setTimeout(r, 200));
  }

  bar.classList.replace("bg-blue-500", "bg-green-500");
  text.textContent = "✅ 모든 토지정보 수집이 완료되었습니다.";

  excelBtn.disabled = false;
  collectBtn.disabled = false;
  collectBtn.classList.remove("opacity-50", "cursor-not-allowed");
}
