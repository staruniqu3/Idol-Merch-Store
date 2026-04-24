import { Router, type IRouter } from "express";
import { desc, notInArray } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { getAllSheetPhones } from "../lib/google-sheets";

const router: IRouter = Router();

// Public board: show active orders (not delivered/cancelled) from the orders table.
// Admin updates status via the Orders tab — this endpoint auto-reflects those changes.
router.get("/order-status", async (_req, res): Promise<void> => {
  const orders = await db
    .select({
      id: ordersTable.id,
      phone: ordersTable.memberPhone,
      customerName: ordersTable.memberName,
      status: ordersTable.status,
      items: ordersTable.items,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .where(notInArray(ordersTable.status, ["delivered", "cancelled"]))
    .orderBy(desc(ordersTable.updatedAt));

  res.json(orders);
});

// Returns all unique phone numbers found in the Google Form sheets (both old and new).
// Used by admin to cross-reference with DB orders.
router.get("/sheet-phones", async (_req, res): Promise<void> => {
  try {
    const phones = await getAllSheetPhones();
    res.json({ phones });
  } catch {
    res.json({ phones: [] });
  }
});

export default router;
