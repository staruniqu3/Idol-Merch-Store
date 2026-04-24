import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, orderStatusBoardTable } from "@workspace/db";

const router: IRouter = Router();

export const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ Chờ xác nhận",
  confirmed: "✅ Đã xác nhận thông tin",
  preparing: "📦 Đang chuẩn bị hàng",
  shipped: "🚚 Đã giao ĐVVC",
  done: "🎉 Hoàn thành",
  cancelled: "❌ Đã huỷ",
};

router.get("/order-status", async (_req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(orderStatusBoardTable)
    .orderBy(desc(orderStatusBoardTable.updatedAt));
  res.json(entries);
});

router.post("/order-status", async (req, res): Promise<void> => {
  const { phone, customerName, status, note } = req.body;
  if (!phone || !status) {
    res.status(400).json({ error: "phone and status required" });
    return;
  }
  const [entry] = await db
    .insert(orderStatusBoardTable)
    .values({
      phone: String(phone).trim(),
      customerName: customerName ? String(customerName).trim() : null,
      status: String(status),
      note: note ? String(note).trim() : null,
    })
    .returning();
  res.status(201).json(entry);
});

router.patch("/order-status/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { phone, customerName, status, note } = req.body;
  const update: Record<string, unknown> = {};
  if (phone !== undefined) update.phone = String(phone).trim();
  if (customerName !== undefined) update.customerName = customerName ? String(customerName).trim() : null;
  if (status !== undefined) update.status = String(status);
  if (note !== undefined) update.note = note ? String(note).trim() : null;
  const [updated] = await db
    .update(orderStatusBoardTable)
    .set(update)
    .where(eq(orderStatusBoardTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/order-status/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(orderStatusBoardTable).where(eq(orderStatusBoardTable.id, id));
  res.status(204).end();
});

export default router;
