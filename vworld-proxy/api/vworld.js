import fetch from "node-fetch";

export default async function handler(req, res) {
  const { pnu } = req.query;

  if (!pnu) {
    return res.status(400).json({ error: "pnu parameter is required" });
  }

  const key = "BE552462-0744-32DB-81E7-1B7317390D68";
  const domain = "sharif9711.github.io";
  const stdrYear = "2017";

  const url = `https://api.vworld.kr/ned/data/getLandCharacteristics?pnu=${pnu}&stdrYear=${stdrYear}&format=json&numOfRows=1&pageNo=1&key=${key}&domain=${domain}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
}
