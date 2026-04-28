import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, manualOrdersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/manual-orders", async (_req, res): Promise<void> => {
  const rows = await db.select().from(manualOrdersTable).orderBy(manualOrdersTable.createdAt);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});

router.post("/manual-orders", async (req, res): Promise<void> => {
  const { id, customerName, phone, items, note, date, status } = req.body;
  if (!customerName) { res.status(400).json({ error: "customerName required" }); return; }
  const [row] = await db.insert(manualOrdersTable).values({
    id: id ?? crypto.randomUUID(),
    customerName,
    phone: phone ?? "",
    items: typeof items === "string" ? items : JSON.stringify(items ?? []),
    note: note ?? "",
    date: date ?? "",
    status: status ?? "pending",
  }).returning();
  res.status(201).json({ ...row, items: JSON.parse(row.items) });
});

router.put("/manual-orders/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { customerName, phone, items, note, date, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (customerName !== undefined) updates.customerName = customerName;
  if (phone !== undefined) updates.phone = phone;
  if (items !== undefined) updates.items = typeof items === "string" ? items : JSON.stringify(items);
  if (note !== undefined) updates.note = note;
  if (date !== undefined) updates.date = date;
  if (status !== undefined) updates.status = status;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "nothing to update" }); return; }
  const [row] = await db.update(manualOrdersTable).set(updates).where(eq(manualOrdersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ ...row, items: JSON.parse(row.items) });
});

router.delete("/manual-orders/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  await db.delete(manualOrdersTable).where(eq(manualOrdersTable.id, id));
  res.json({ ok: true });
});

export default router;
