import { Router, type IRouter } from "express";

const router: IRouter = Router();

const CURRENCIES = ["KRW", "THB", "USD", "JPY", "GBP", "EUR", "CNY", "HKD", "MYR", "PHP", "INR", "TWD", "SGD"];

let cache: { rates: Record<string, number>; updatedAt: string } | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWiseRates(): Promise<{ rates: Record<string, number>; updatedAt: string }> {
  const results = await Promise.all(
    CURRENCIES.map(async (curr) => {
      const url = `https://wise.com/rates/live?source=${curr}&target=VND`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });
      if (!res.ok) throw new Error(`Wise: failed for ${curr}`);
      const data = await res.json() as { source: string; target: string; value: number; time: number };
      return { code: curr, value: data.value, time: data.time };
    })
  );

  const rates: Record<string, number> = {};
  let latestTime = 0;
  for (const r of results) {
    rates[r.code] = r.value;
    if (r.time > latestTime) latestTime = r.time;
  }

  const updatedAt = latestTime
    ? new Date(latestTime).toUTCString()
    : new Date().toUTCString();

  return { rates, updatedAt };
}

async function fetchFallbackRates(): Promise<{ rates: Record<string, number>; updatedAt: string }> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error("open.er-api: request failed");
  const data = await res.json() as { rates: Record<string, number>; time_last_update_utc: string };
  const usdToVnd = data.rates["VND"] ?? 1;

  const rates: Record<string, number> = {};
  for (const curr of CURRENCIES) {
    if (curr === "USD") {
      rates[curr] = usdToVnd;
    } else {
      const usdToCurr = data.rates[curr];
      if (usdToCurr) rates[curr] = usdToVnd / usdToCurr;
    }
  }
  return { rates, updatedAt: data.time_last_update_utc };
}

router.get("/exchange-rates", async (_req, res): Promise<void> => {
  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      res.json(cache);
      return;
    }

    let result: { rates: Record<string, number>; updatedAt: string };
    try {
      result = await fetchWiseRates();
    } catch {
      console.warn("[exchange-rates] Wise failed, falling back to open.er-api");
      result = await fetchFallbackRates();
    }

    cache = result;
    cacheTime = Date.now();
    res.json(cache);
  } catch (err) {
    if (cache) {
      res.json({ ...cache, stale: true });
    } else {
      res.status(500).json({ error: "Không thể tải tỷ giá" });
    }
  }
});

export default router;
