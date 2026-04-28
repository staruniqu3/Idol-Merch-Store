import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const slotBookingsTable = pgTable("slot_bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  variant: text("variant"),
  subVariant: text("sub_variant"),
  phone: text("phone").notNull(),
  socialHandle: text("social_handle"),
  quantity: integer("quantity").notNull().default(1),
  slotNumber: integer("slot_number").notNull(),
  queueCode: text("queue_code").notNull(),
  status: text("status").notNull().default("pending"),
  mbsVerified: boolean("mbs_verified"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SlotBooking = typeof slotBookingsTable.$inferSelect;
