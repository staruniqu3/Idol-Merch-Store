import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, preorderScheduleTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/preorder-schedule", async (_req, res): Promise<void> => {
  const items = await db.select().from(preorderScheduleTable).orderBy(preorderScheduleTable.createdAt);
  res.json(items);
});

router.post("/preorder-schedule", async (req, res): Promise<void> => {
  const { title, description, deadline, imageUrl, artist, isActive } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [item] = await db.insert(preorderScheduleTable).values({
    title,
    description: description ?? null,
    deadline: deadline ?? null,
    imageUrl: imageUrl ?? null,
    artist: artist ?? null,
    isActive: isActive ?? true,
  }).returning();
  res.status(201).json(item);
});

router.patch("/preorder-schedule/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const { title, description, deadline, imageUrl, artist, isActive } = req.body;
  const [item] = await db.update(preorderScheduleTable).set({
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(deadline !== undefined && { deadline }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(artist !== undefined && { artist }),
    ...(isActive !== undefined && { isActive }),
  }).where(eq(preorderScheduleTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.delete("/preorder-schedule/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [item] = await db.delete(preorderScheduleTable).where(eq(preorderScheduleTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
