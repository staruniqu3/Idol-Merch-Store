import { Router, type IRouter } from "express";
import {
  getMemberOrdersByPhone,
  getMemberProfile,
  getMemberShipping,
  getAllShippingTracking,
  getAllMembers,
  invalidateToken,
} from "../lib/google-sheets";
import { db, shippingDeliveryLogTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function withTokenRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("invalid authentication") || msg.includes("401") || msg.includes("not connected")) {
      invalidateToken();
      return await fn();
    }
    throw err;
  }
}

const router: IRouter = Router();

router.get("/sheets/member-orders", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  try {
    const orders = await withTokenRetry(() => getMemberOrdersByPhone(phone));
    res.json(orders);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/member-profile", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  try {
    const profile = await withTokenRetry(() => getMemberProfile(phone));
    if (!profile) { res.status(404).json({ error: "Member not found" }); return; }
    res.json(profile);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/member-shipping", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  try {
    const shipping = await withTokenRetry(() => getMemberShipping(code));
    res.json(shipping);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

function isDelivered(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes("đã giao") || s.includes("giao thành công");
}

router.get("/sheets/all-shipping", async (_req, res): Promise<void> => {
  try {
    const rows = await withTokenRetry(() => getAllShippingTracking());

    // Upsert delivery timestamps for newly-delivered rows (INSERT if not exists)
    const deliveredRows = rows.filter((r) => r.trackingCode && isDelivered(r.status));
    if (deliveredRows.length > 0) {
      await db
        .insert(shippingDeliveryLogTable)
        .values(deliveredRows.map((r) => ({ trackingCode: r.trackingCode })))
        .onConflictDoNothing();
    }

    // Load all log entries to know delivery timestamps
    const logEntries = await db.select().from(shippingDeliveryLogTable);
    const logMap = new Map(logEntries.map((e) => [e.trackingCode, e.deliveredAt]));

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Filter: hide delivered rows that have been delivered for more than 3 days
    const filtered = rows.filter((r) => {
      if (!isDelivered(r.status)) return true;
      const deliveredAt = logMap.get(r.trackingCode);
      if (!deliveredAt) return true;
      return now - deliveredAt.getTime() < THREE_DAYS_MS;
    });

    res.json(filtered);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/all-members", async (_req, res): Promise<void> => {
  try {
    const members = await withTokenRetry(() => getAllMembers());
    res.json(members);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

export default router;
