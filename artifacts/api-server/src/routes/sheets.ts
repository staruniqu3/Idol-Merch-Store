import { Router, type IRouter } from "express";
import { getMemberOrdersByPhone } from "../lib/google-sheets";

const router: IRouter = Router();

router.get("/sheets/member-orders", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) {
    res.status(400).json({ error: "phone required" });
    return;
  }
  try {
    const orders = await getMemberOrdersByPhone(phone);
    res.json(orders);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

export default router;
