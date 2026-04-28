import { Router, type IRouter } from "express";
import { eq, and, isNull, count } from "drizzle-orm";
import { db, slotBookingsTable, productsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/slot-bookings", async (req, res): Promise<void> => {
  const { productId, variant, subVariant, phone } = req.body;

  if (!productId || !phone) {
    res.status(400).json({ error: "productId and phone are required" });
    return;
  }

  const pid = Number(productId);
  if (isNaN(pid)) { res.status(400).json({ error: "Invalid productId" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, pid));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const slotConfig = (product as any).slotConfig as Record<string, { capacity: number }> | null;
  const slotPrefix = ((product as any).slotPrefix as string | null) ?? "SLOT";

  const variantVal: string | null = variant ?? null;
  const subVariantVal: string | null = subVariant ?? null;

  const conditions = [eq(slotBookingsTable.productId, pid)];
  if (variantVal) {
    conditions.push(eq(slotBookingsTable.variant, variantVal));
  } else {
    conditions.push(isNull(slotBookingsTable.variant));
  }
  if (subVariantVal) {
    conditions.push(eq(slotBookingsTable.subVariant, subVariantVal));
  } else {
    conditions.push(isNull(slotBookingsTable.subVariant));
  }

  const [{ count: existingCount }] = await db
    .select({ count: count() })
    .from(slotBookingsTable)
    .where(and(...conditions));

  const existing = Number(existingCount);

  if (slotConfig) {
    const key = variantVal && subVariantVal
      ? `${variantVal}::${subVariantVal}`
      : variantVal ?? "";
    const cfg = slotConfig[key];
    if (cfg && cfg.capacity > 0 && existing >= cfg.capacity) {
      res.status(409).json({ error: "Slot đã đầy cho lựa chọn này" });
      return;
    }
  }

  const slotNumber = existing + 1;

  const parts: string[] = [slotPrefix];
  if (variantVal) parts.push(variantVal);
  if (subVariantVal) parts.push(subVariantVal);
  parts.push(String(slotNumber).padStart(3, "0"));
  const queueCode = parts.join("_");

  const [booking] = await db.insert(slotBookingsTable).values({
    productId: pid,
    productName: product.name,
    variant: variantVal,
    subVariant: subVariantVal,
    phone: String(phone),
    slotNumber,
    queueCode,
    status: "pending",
  }).returning();

  res.status(201).json(booking);
});

router.get("/slot-bookings", async (_req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(slotBookingsTable)
    .orderBy(slotBookingsTable.createdAt);
  res.json(bookings);
});

router.patch("/slot-bookings/:id", async (req, res): Promise<void> => {
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status required" }); return; }
  const [booking] = await db
    .update(slotBookingsTable)
    .set({ status: String(status) })
    .where(eq(slotBookingsTable.id, req.params.id))
    .returning();
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  res.json(booking);
});

router.delete("/slot-bookings/:id", async (req, res): Promise<void> => {
  const [booking] = await db
    .delete(slotBookingsTable)
    .where(eq(slotBookingsTable.id, req.params.id))
    .returning();
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
