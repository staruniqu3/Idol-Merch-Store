import { Router, type IRouter } from "express";
import { eq, and, isNull, count, ne, max, lt } from "drizzle-orm";
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
  const { productId, variant, subVariant, phone, socialHandle, quantity } = req.body;

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
  // Current lot number for this product (incremented each time admin completes a lot)
  const currentLot: number = Number(slotConfig?.["_currentLot"] ?? 1);

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

  // Per-variant/sub-variant capacity enforcement (scoped to current lot)
  if (slotConfig && variantVal) {
    const configKey = subVariantVal ? `${variantVal}::${subVariantVal}` : variantVal;
    const slotLimit = Number(
      slotConfig[configKey]?.totalSlots ??
      slotConfig[variantVal]?.totalSlots ??
      slotConfig["_totalSlots"] ?? 0
    );
    if (slotLimit > 0) {
      const checkConditions = [
        eq(slotBookingsTable.productId, pid),
        eq(slotBookingsTable.variant, variantVal),
        eq(slotBookingsTable.lotNumber, currentLot),
        ne(slotBookingsTable.status, "cancelled"),
      ];
      if (subVariantVal) {
        checkConditions.push(eq(slotBookingsTable.subVariant, subVariantVal));
      } else {
        checkConditions.push(isNull(slotBookingsTable.subVariant));
      }
      const [{ count: slotCount }] = await db
        .select({ count: count() })
        .from(slotBookingsTable)
        .where(and(...checkConditions));
      if (Number(slotCount) >= slotLimit) {
        res.status(409).json({ error: "Slot đã đầy, không còn lượt đặt cho biến thể này" });
        return;
      }
    }
  }

  // Get MAX slot number within the current lot so slot numbers restart from 1 each lot
  const variantConditions = [
    eq(slotBookingsTable.productId, pid),
    eq(slotBookingsTable.lotNumber, currentLot),
  ];
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

  const [{ maxSlot }] = await db
    .select({ maxSlot: max(slotBookingsTable.slotNumber) })
    .from(slotBookingsTable)
    .where(and(...variantConditions));

  const slotNumber = (maxSlot ?? 0) + 1;

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
    quantity: quantity ? Math.max(1, Number(quantity)) : 1,
    lotNumber: currentLot,
    slotNumber,
    queueCode,
    status: "pending",
    mbsVerified: mbsVerified,
    adminNote: null,
  }).returning();

  res.status(201).json(booking);
});

router.get("/slot-bookings", async (_req, res): Promise<void> => {
  // Auto-delete form_required bookings older than 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await db
    .delete(slotBookingsTable)
    .where(
      and(
        eq(slotBookingsTable.status, "form_required"),
        lt(slotBookingsTable.formSubmittedAt, threeDaysAgo)
      )
    );

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

// Public: look up confirmed slot bookings by member code (for member private page)
router.get("/slot-bookings/by-member-code", async (req, res): Promise<void> => {
  const code = String(req.query.code ?? "").trim();
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  const bookings = await db
    .select()
    .from(slotBookingsTable)
    .where(and(eq(slotBookingsTable.memberCode, code), ne(slotBookingsTable.status, "cancelled")));
  res.json(bookings.map((b) => ({
    id: b.id,
    queueCode: b.queueCode,
    productName: b.productName,
    variant: b.variant,
    subVariant: b.subVariant,
    quantity: b.quantity,
    status: b.status,
    lotNumber: b.lotNumber,
    slotNumber: b.slotNumber,
    paymentDeadline: b.paymentDeadline,
    createdAt: b.createdAt,
  })));
});

// Public: look up slot bookings by phone (for customer status check)
router.get("/slot-bookings/by-phone", async (req, res): Promise<void> => {
  const phone = String(req.query.phone ?? "").trim();
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  const bookings = await db
    .select()
    .from(slotBookingsTable)
    .where(and(eq(slotBookingsTable.phone, phone), ne(slotBookingsTable.status, "cancelled")));
  res.json(bookings.map((b) => ({
    id: b.id,
    queueCode: b.queueCode,
    productName: b.productName,
    variant: b.variant,
    subVariant: b.subVariant,
    quantity: b.quantity,
    status: b.status,
    memberCode: b.memberCode,
    paymentDeadline: b.paymentDeadline,
    createdAt: b.createdAt,
  })));
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
  const { status, adminNote, crossRefChecked, memberCode } = req.body;
  const updates: Record<string, unknown> = {};
  if (status !== undefined) {
    updates.status = String(status);
    // Set paymentDeadline to NOW + 24h when moving to payment_pending
    if (status === "payment_pending") {
      updates.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    // Clear paymentDeadline when leaving payment_pending
    if (status !== "payment_pending" && status !== undefined) {
      // Only clear if explicitly changing away
    }
    // Set formSubmittedAt when moving to form_required
    if (status === "form_required") {
      updates.formSubmittedAt = new Date();
    }
  }
  if (adminNote !== undefined) updates.adminNote = adminNote ? String(adminNote) : null;
  if (crossRefChecked !== undefined) updates.crossRefChecked = Boolean(crossRefChecked);
  if (memberCode !== undefined) updates.memberCode = memberCode ? String(memberCode) : null;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "status, adminNote, crossRefChecked, or memberCode required" });
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

// Admin: complete current lot → increment _currentLot in product's slotConfig, preserving history
router.post("/slot-bookings/:productId/complete-lot", async (req, res): Promise<void> => {
  const pid = Number(req.params.productId);
  if (isNaN(pid)) { res.status(400).json({ error: "Invalid productId" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, pid));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const currentConfig = ((product as any).slotConfig ?? {}) as Record<string, any>;
  const currentLot = Number(currentConfig["_currentLot"] ?? 1);
  const newLot = currentLot + 1;

  const newConfig = { ...currentConfig, _currentLot: newLot };

  const [updated] = await db
    .update(productsTable)
    .set({ slotConfig: newConfig } as any)
    .where(eq(productsTable.id, pid))
    .returning();

  res.json({ ok: true, previousLot: currentLot, currentLot: newLot, product: updated });
});

export default router;
