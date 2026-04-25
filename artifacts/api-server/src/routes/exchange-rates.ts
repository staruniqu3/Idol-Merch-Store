import { Router, type IRouter } from "express";

const router: IRouter = Router();

const CURRENCIES = ["KRW", "THB", "USD", "JPY", "GBP", "EUR", "CNY", "HKD", "MYR", "PHP", "INR", "TWD"];

let cache: { rates: Record<string, number>; updatedAt: string } | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get("/exchange-rates", async (_req, res): Promise<void> => {
  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      res.json(cache);
      return;
    }

    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch rates");

    const data = await response.json() as { rates: Record<string, number>; time_last_update_utc: string };
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

    cache = { rates, updatedAt: data.time_last_update_utc };
    cacheTime = Date.now();
    res.json(cache);
  } catch (err) {
    res.status(500).json({ error: "Không thể tải tỷ giá" });
  }
});

export default router;
