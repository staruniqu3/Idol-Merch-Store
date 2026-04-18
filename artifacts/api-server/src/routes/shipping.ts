import { Router, type IRouter } from "express";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { db, shippingUpdatesTable } from "@workspace/db";
import {
  ListShippingUpdatesResponse,
  CreateShippingUpdateBody,
  UpdateShippingUpdateParams,
  UpdateShippingUpdateBody,
  UpdateShippingUpdateResponse,
  DeleteShippingUpdateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

router.get("/shipping", async (req, res): Promise<void> => {
  const showAll = req.query.all === "true";
  const all = await db.select().from(shippingUpdatesTable).orderBy(shippingUpdatesTable.createdAt);

  const updates = showAll
    ? all
    : all.filter((u) => {
        if (u.status !== "returned") return true;
        if (!u.returnedAt) return true;
        return Date.now() - u.returnedAt.getTime() < TWO_WEEKS_MS;
      });

  res.json(ListShippingUpdatesResponse.parse(updates));
});

router.post("/shipping", async (req, res): Promise<void> => {
  const parsed = CreateShippingUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const values: typeof shippingUpdatesTable.$inferInsert = { ...parsed.data };
  if (values.status === "returned") {
    values.returnedAt = new Date();
  }

  const [update] = await db.insert(shippingUpdatesTable).values(values).returning();
  res.status(201).json(update);
});

router.patch("/shipping/:id", async (req, res): Promise<void> => {
  const params = UpdateShippingUpdateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateShippingUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const setData: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.status === "returned") {
    setData.returnedAt = new Date();
  } else if (parsed.data.status !== undefined) {
    setData.returnedAt = null;
  }

  const [update] = await db
    .update(shippingUpdatesTable)
    .set(setData as Partial<typeof shippingUpdatesTable.$inferInsert>)
    .where(eq(shippingUpdatesTable.id, params.data.id))
    .returning();

  if (!update) {
    res.status(404).json({ error: "Shipping update not found" });
    return;
  }

  res.json(UpdateShippingUpdateResponse.parse(update));
});

router.delete("/shipping/:id", async (req, res): Promise<void> => {
  const params = DeleteShippingUpdateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [update] = await db.delete(shippingUpdatesTable).where(eq(shippingUpdatesTable.id, params.data.id)).returning();
  if (!update) {
    res.status(404).json({ error: "Shipping update not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
