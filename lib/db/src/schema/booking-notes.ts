import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

export const bookingNotesTable = pgTable("booking_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  event: text("event"),
  eventDate: text("event_date"),
  price: text("price"),
  deadline: text("deadline"),
  status: text("status").notNull().default("draft"),
  assignedTo: jsonb("assigned_to").$type<Array<{ name: string; phone: string; customerCode: string }>>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BookingNote = typeof bookingNotesTable.$inferSelect;
