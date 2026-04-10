import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, bookingNotesTable } from "@workspace/db";

const router: IRouter = Router();

// Public: only published notes
router.get("/booking-notes", async (req, res): Promise<void> => {
  const all = req.query.all === "true";
  const notes = all
    ? await db.select().from(bookingNotesTable).orderBy(desc(bookingNotesTable.createdAt))
    : await db.select().from(bookingNotesTable).where(eq(bookingNotesTable.status, "published")).orderBy(desc(bookingNotesTable.createdAt));
  res.json(notes);
});

router.post("/booking-notes", async (req, res): Promise<void> => {
  const { title, content, event, eventDate, price, deadline } = req.body;
  if (!title || !content) { res.status(400).json({ error: "title and content required" }); return; }
  const [note] = await db.insert(bookingNotesTable).values({
    title: String(title),
    content: String(content),
    event: event ? String(event) : null,
    eventDate: eventDate ? String(eventDate) : null,
    price: price ? String(price) : null,
    deadline: deadline ? String(deadline) : null,
    status: "draft",
  }).returning();
  res.status(201).json(note);
});

router.patch("/booking-notes/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, content, event, eventDate, price, deadline, status } = req.body;
  const update: Record<string, unknown> = {};
  if (title != null) update.title = String(title);
  if (content != null) update.content = String(content);
  if (event != null) update.event = event === "" ? null : String(event);
  if (eventDate != null) update.eventDate = eventDate === "" ? null : String(eventDate);
  if (price != null) update.price = price === "" ? null : String(price);
  if (deadline != null) update.deadline = deadline === "" ? null : String(deadline);
  if (status != null) update.status = String(status);
  const [updated] = await db.update(bookingNotesTable).set(update as Partial<typeof bookingNotesTable.$inferInsert>).where(eq(bookingNotesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/booking-notes/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(bookingNotesTable).where(eq(bookingNotesTable.id, id));
  res.status(204).send();
});

export default router;
