import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const orderStatusBoardTable = pgTable("order_status_board", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  customerName: text("customer_name"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type OrderStatusEntry = typeof orderStatusBoardTable.$inferSelect;
