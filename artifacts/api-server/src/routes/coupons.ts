import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/coupons", async (req, res): Promise<void> => {
  const all = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);

  if (req.query.all === "true") {
    res.json(all);
    return;
  }

  const { phone, tier } = req.query as { phone?: string; tier?: string };
  const today = new Date().toISOString().slice(0, 10);

  const visible = all.filter((c) => {
    if (!c.isActive) return false;
    if (c.expiresAt && c.expiresAt < today) return false;

    const members = (c.assignedMembers ?? []) as { phone: string }[];
    const tiers = (c.eligibleTiers ?? []) as string[];

    if (members.length > 0) {
      if (!phone) return false;
      const norm = (p: string) => p.replace(/\D/g, "").replace(/^84/, "0");
      return members.some((m) => norm(m.phone) === norm(phone));
    }

    if (tiers.length > 0) {
      if (!tier) return false;
      return tiers.map((t) => t.toLowerCase()).includes(tier.toLowerCase());
    }

    return true;
  });

  res.json(visible);
});

router.post("/coupons", async (req, res): Promise<void> => {
  const { code, title, description, discountType, discountValue, eligibleTiers, assignedMembers, expiresAt, isActive } = req.body;
  if (!code || !title) { res.status(400).json({ error: "code and title required" }); return; }
  const [item] = await db.insert(couponsTable).values({
    code: code.trim().toUpperCase(),
    title,
    description: description ?? null,
    discountType: discountType ?? "fixed",
    discountValue: discountValue ?? null,
    eligibleTiers: eligibleTiers ?? [],
    assignedMembers: assignedMembers ?? [],
    expiresAt: expiresAt ?? null,
    isActive: isActive ?? true,
  }).returning();
  res.status(201).json(item);
});

router.patch("/coupons/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const { code, title, description, discountType, discountValue, eligibleTiers, assignedMembers, expiresAt, isActive, isUsed, usedAt } = req.body;
  const setData: Record<string, unknown> = {};
  if (code !== undefined) setData.code = String(code).trim().toUpperCase();
  if (title !== undefined) setData.title = title;
  if (description !== undefined) setData.description = description;
  if (discountType !== undefined) setData.discountType = discountType;
  if (discountValue !== undefined) setData.discountValue = discountValue;
  if (eligibleTiers !== undefined) setData.eligibleTiers = eligibleTiers;
  if (assignedMembers !== undefined) setData.assignedMembers = assignedMembers;
  if (expiresAt !== undefined) setData.expiresAt = expiresAt;
  if (isActive !== undefined) setData.isActive = isActive;
  if (isUsed !== undefined) setData.isUsed = isUsed;
  if (usedAt !== undefined) setData.usedAt = usedAt ? new Date(usedAt) : null;
  const [item] = await db.update(couponsTable).set(setData as Partial<typeof couponsTable.$inferInsert>).where(eq(couponsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.delete("/coupons/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [item] = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
