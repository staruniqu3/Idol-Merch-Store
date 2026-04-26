import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const MANUAL_RATES_KEY = "cost_manual_rates";

router.get("/settings/manual-rates", async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, MANUAL_RATES_KEY));
    if (rows.length === 0) {
      res.json({});
      return;
    }
    res.json(JSON.parse(rows[0].value));
  } catch (err) {
    console.error("[settings/manual-rates GET]", err);
    res.status(500).json({ error: "Không thể tải cài đặt" });
  }
});

router.put("/settings/manual-rates", async (req, res): Promise<void> => {
  try {
    const value = JSON.stringify(req.body ?? {});
    await db.insert(settingsTable)
      .values({ key: MANUAL_RATES_KEY, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) {
    console.error("[settings/manual-rates PUT]", err);
    res.status(500).json({ error: "Không thể lưu cài đặt" });
  }
});

export default router;
