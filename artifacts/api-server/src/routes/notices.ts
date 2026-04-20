import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, noticesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notices", async (_req, res): Promise<void> => {
  const notices = await db.select().from(noticesTable).orderBy(desc(noticesTable.isPinned), desc(noticesTable.createdAt));
  res.json(notices);
});

router.post("/notices", async (req, res): Promise<void> => {
  const { title, content, type, isPinned, seller, soldNotes } = req.body;
  if (!title || !content) { res.status(400).json({ error: "title and content required" }); return; }
  const [notice] = await db.insert(noticesTable).values({
    title: String(title),
    content: String(content),
    type: String(type ?? "general"),
    isPinned: Boolean(isPinned ?? false),
    seller: seller ? String(seller) : null,
    soldNotes: soldNotes ? String(soldNotes) : null,
  }).returning();
  res.status(201).json(notice);
});

router.patch("/notices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, content, type, isPinned, seller, soldNotes } = req.body;
  const update: Record<string, unknown> = {};
  if (title != null) update.title = String(title);
  if (content != null) update.content = String(content);
  if (type != null) update.type = String(type);
  if (isPinned != null) update.isPinned = Boolean(isPinned);
  if (seller !== undefined) update.seller = seller ? String(seller) : null;
  if (soldNotes !== undefined) update.soldNotes = soldNotes ? String(soldNotes) : null;
  const [updated] = await db.update(noticesTable).set(update as Partial<typeof noticesTable.$inferInsert>).where(eq(noticesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/notices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(noticesTable).where(eq(noticesTable.id, id));
  res.status(204).send();
});

export default router;
