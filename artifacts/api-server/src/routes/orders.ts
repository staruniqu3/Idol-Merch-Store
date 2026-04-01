import { Router, type IRouter } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, ordersTable, membersTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  ListOrdersResponse,
  CreateOrderBody,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  GetOrderSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    totalAmount: parseFloat(o.totalAmount),
    memberId: o.memberId ?? null,
  };
}

router.get("/orders/summary", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const [memberCount] = await db.select({ count: count() }).from(membersTable);

  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  const pending = allOrders.filter((o) => o.status === "pending").length;
  const shipped = allOrders.filter((o) => o.status === "shipped").length;
  const delivered = allOrders.filter((o) => o.status === "delivered").length;

  res.json(
    GetOrderSummaryResponse.parse({
      totalOrders: allOrders.length,
      pendingOrders: pending,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      totalRevenue,
      totalMembers: memberCount?.count ?? 0,
    })
  );
});

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  let orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

  if (query.success) {
    if (query.data.memberId) {
      orders = orders.filter((o) => o.memberId === query.data.memberId);
    }
    if (query.data.status) {
      orders = orders.filter((o) => o.status === query.data.status);
    }
  }

  res.json(ListOrdersResponse.parse(orders.map(mapOrder)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pointsEarned = Math.floor(parsed.data.totalAmount / 10000);

  const [order] = await db
    .insert(ordersTable)
    .values({
      ...parsed.data,
      totalAmount: String(parsed.data.totalAmount),
      status: "pending",
      pointsEarned,
    })
    .returning();

  if (parsed.data.memberId && pointsEarned > 0) {
    const [existing] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.memberId));
    if (existing) {
      const newPoints = existing.points + pointsEarned;
      const tier =
        newPoints >= 5000 ? "platinum" :
        newPoints >= 2000 ? "gold" :
        newPoints >= 500 ? "silver" : "bronze";
      await db.update(membersTable).set({ points: newPoints, tier }).where(eq(membersTable.id, parsed.data.memberId));
    }
  }

  res.status(201).json(GetOrderResponse.parse(mapOrder(order)));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(mapOrder(order)));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set(parsed.data as Partial<typeof ordersTable.$inferInsert>)
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderResponse.parse(mapOrder(order)));
});

export default router;
