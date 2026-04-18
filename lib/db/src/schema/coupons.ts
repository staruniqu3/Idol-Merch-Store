import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull().default("fixed"),
  discountValue: text("discount_value"),
  eligibleTiers: jsonb("eligible_tiers").$type<string[]>().default([]),
  assignedMembers: jsonb("assigned_members").$type<{ name: string; phone: string; customerCode: string }[]>().default([]),
  expiresAt: text("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
