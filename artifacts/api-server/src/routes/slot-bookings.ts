import { Router, type IRouter } from "express";
import { eq, and, isNull, count } from "drizzle-orm";
import { db, slotBookingsTable, productsTable, settingsTable } from "@workspace/db";
import { getSovereignClubPhones } from "../lib/google-sheets";

const router: IRouter = Router();

async function getSovereignClubSheetId(): Promise<string> {
  try {
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, "sovereign_club_sheet_id"));
    if (rows.length === 0) return "";
    const val = JSON.parse(rows[0].value);
    return typeof val === "string" ? val.trim() : "";
  } catch {
    return "";
  }
}

router.post("/slot-bookings", async (req, res): Promise<void> => {
  const { productId, variant, subVariant, phone, socialHandle } = req.body;

  if (!productId || !phone) {
    res.status(400).json({ error: "productId and phone are required" });
    return;
  }

  const pid = Number(productId);
  if (isNaN(pid)) { res.status(400).json({ error: "Invalid productId" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, pid));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const slotConfig = (product as any).slotConfig as Record<string, any> | null;
  const slotPrefix = ((product as any).slotPrefix as string | null) ?? "SLOT";
  const variants = (product as any).variants as Array<{ name: string; memberOnly?: boolean }> | null;

  const variantVal: string | null = variant ?? null;
  const subVariantVal: string | null = subVariant ?? null;

  // Check if the booked variant is MBS-gated
  let mbsVerified: boolean | null = null;
  const variantData = variants?.find((v) => v.name === variantVal);
  if (variantData?.memberOnly) {
    const sheetId = await getSovereignClubSheetId();
    if (sheetId) {
      try {
        const phones = await getSovereignClubPhones(sheetId);
        const norm = (p: string) => p.replace(/\D/g, "").replace(/^84/, "0");
        const normalizedInput = norm(String(phone).trim());
        mbsVerified = phones.some((p) => norm(p) === normalizedInput);
      } catch {
        mbsVerified = null;
      }
    }
  }

  // Count ALL bookings for this product → used for _totalSlots capacity enforcement
  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(slotBookingsTable)
    .where(eq(slotBookingsTable.productId, pid));

  const totalExisting = Number(totalCount);

  if (slotConfig) {
    const totalSlots = Number((slotConfig as any)["_totalSlots"] ?? 0);
    if (totalSlots > 0 && totalExisting >= totalSlots) {
      res.status(409).json({ error: "Slot đã đầy, không còn lượt đặt" });
      return;
    }
  }

  // Count bookings for this specific variant/subVariant → sequential slot number
  const variantConditions = [eq(slotBookingsTable.productId, pid)];
  if (variantVal) {
    variantConditions.push(eq(slotBookingsTable.variant, variantVal));
  } else {
    variantConditions.push(isNull(slotBookingsTable.variant));
  }
  if (subVariantVal) {
    variantConditions.push(eq(slotBookingsTable.subVariant, subVariantVal));
  } else {
    variantConditions.push(isNull(slotBookingsTable.subVariant));
  }

  const [{ count: variantCount }] = await db
    .select({ count: count() })
    .from(slotBookingsTable)
    .where(and(...variantConditions));

  const variantExisting = Number(variantCount);
  const slotNumber = variantExisting + 1;

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
    socialHandle: socialHandle ? String(socialHandle).trim() : null,
    slotNumber,
    queueCode,
    status: "pending",
    mbsVerified: mbsVerified,
    adminNote: null,
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

// Check if phone is in Sovereign Club MBS list
router.get("/slot-bookings/mbs-check", async (req, res): Promise<void> => {
  const { phone } = req.query;
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "phone required" });
    return;
  }
  const sheetId = await getSovereignClubSheetId();
  if (!sheetId) {
    res.json({ valid: null, message: "Chưa cấu hình danh sách MBS" });
    return;
  }
  try {
    const phones = await getSovereignClubPhones(sheetId);
    const norm = (p: string) => p.replace(/\D/g, "").replace(/^84/, "0");
    const normalizedInput = norm(phone.trim());
    const valid = phones.some((p) => norm(p) === normalizedInput);
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: "Không thể kiểm tra danh sách MBS" });
  }
});

// Admin: get full MBS phone list
router.get("/slot-bookings/mbs-phones", async (_req, res): Promise<void> => {
  const sheetId = await getSovereignClubSheetId();
  if (!sheetId) {
    res.json({ phones: [], configured: false });
    return;
  }
  try {
    const phones = await getSovereignClubPhones(sheetId);
    res.json({ phones, configured: true });
  } catch (err) {
    res.status(500).json({ error: "Không thể tải danh sách MBS" });
  }
});

router.patch("/slot-bookings/:id", async (req, res): Promise<void> => {
  const { status, adminNote } = req.body;
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = String(status);
  if (adminNote !== undefined) updates.adminNote = adminNote ? String(adminNote) : null;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "status or adminNote required" });
    return;
  }
  const [booking] = await db
    .update(slotBookingsTable)
    .set(updates as any)
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
