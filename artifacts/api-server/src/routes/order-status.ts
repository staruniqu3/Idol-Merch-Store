import { Router, type IRouter } from "express";
import { desc, notInArray } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";

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
      note: ordersTable.notes,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .where(notInArray(ordersTable.status, ["delivered", "cancelled"]))
    .orderBy(desc(ordersTable.updatedAt));

  res.json(orders);
});

export default router;
