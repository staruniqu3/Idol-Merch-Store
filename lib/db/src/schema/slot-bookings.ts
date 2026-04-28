import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const slotBookingsTable = pgTable("slot_bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  variant: text("variant"),
  subVariant: text("sub_variant"),
  phone: text("phone").notNull(),
  slotNumber: integer("slot_number").notNull(),
  queueCode: text("queue_code").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SlotBooking = typeof slotBookingsTable.$inferSelect;
