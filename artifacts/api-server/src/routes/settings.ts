import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_KEYS = new Set([
  "admin_cost_manual_rates",
  "admin_profit_entries",
  "admin_profit_expenses",
  "admin_profit_jars",
  "admin_variable_exps",
  "admin_collections",
  "admin_shipper_staff",
  "admin_refunds",
  "admin_year_plans",
  "admin_intl_ship_rates",
  // Deal hunt
  "admin_deal_requests",
  // Stats tab state
  "stats_accounted_order_ids",
  "stats_accounted_manual_ids",
  "stats_ordered_items",
  "stats_batch_history",
  "stats_received_batch_items",
  "stats_ordered_entry_keys",
  "stats_batch_manual_buyers",
  "sovereign_club_sheet_id",
]);

router.get("/settings/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) { res.status(404).json({ error: "Unknown key" }); return; }
  try {
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (rows.length === 0) { res.json(null); return; }
    res.json(JSON.parse(rows[0].value));
  } catch (err) {
    console.error(`[settings GET ${key}]`, err);
    res.status(500).json({ error: "Không thể tải cài đặt" });
  }
});

router.put("/settings/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) { res.status(404).json({ error: "Unknown key" }); return; }
  try {
    const value = JSON.stringify(req.body ?? null);
    await db.insert(settingsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) {
    console.error(`[settings PUT ${key}]`, err);
    res.status(500).json({ error: "Không thể lưu cài đặt" });
  }
});

export default router;
