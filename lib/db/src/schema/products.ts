import { pgTable, text, serial, timestamp, numeric, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  orderType: text("order_type").notNull().default("preorder"),
  orderLabel: text("order_label"),
  orderName: text("order_name"),
  isSoldOut: boolean("is_sold_out").notNull().default(false),
  tags: text("tags").array(),
  variants: jsonb("variants").$type<Array<{ name: string; price?: number; stock?: number; soldOut?: boolean; subVariants?: Array<{ name: string; price?: number; stock?: number; soldOut?: boolean }> }>>(),
  slotPrefix: text("slot_prefix"),
  slotConfig: jsonb("slot_config").$type<Record<string, { capacity: number }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
