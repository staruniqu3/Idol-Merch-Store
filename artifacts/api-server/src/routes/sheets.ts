import { Router, type IRouter } from "express";
import {
  getMemberOrdersByPhone,
  getMemberProfile,
  getMemberShipping,
  getAllShippingTracking,
} from "../lib/google-sheets";

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

router.get("/sheets/member-profile", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) {
    res.status(400).json({ error: "phone required" });
    return;
  }
  try {
    const profile = await getMemberProfile(phone);
    if (!profile) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    res.json(profile);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/member-shipping", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ error: "code required" });
    return;
  }
  try {
    const shipping = await getMemberShipping(code);
    res.json(shipping);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/all-shipping", async (_req, res): Promise<void> => {
  try {
    const rows = await getAllShippingTracking();
    res.json(rows);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

export default router;
