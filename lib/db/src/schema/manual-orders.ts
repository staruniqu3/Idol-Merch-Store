import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const manualOrdersTable = pgTable("manual_orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull().default(""),
  items: text("items").notNull().default("[]"),
  note: text("note").notNull().default(""),
  date: text("date").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ManualOrderRow = typeof manualOrdersTable.$inferSelect;
export type InsertManualOrder = typeof manualOrdersTable.$inferInsert;
