import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import membersRouter from "./members";
import ordersRouter from "./orders";
import shippingRouter from "./shipping";
import rewardsRouter from "./rewards";
import preorderRouter from "./preorder";
import sheetsRouter from "./sheets";
import noticesRouter from "./notices";
import bookingNotesRouter from "./booking-notes";
import couponsRouter from "./coupons";
import orderStatusRouter from "./order-status";
import exchangeRatesRouter from "./exchange-rates";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(membersRouter);
router.use(ordersRouter);
router.use(shippingRouter);
router.use(rewardsRouter);
router.use(preorderRouter);
router.use(sheetsRouter);
router.use(noticesRouter);
router.use(bookingNotesRouter);
router.use(couponsRouter);
router.use(orderStatusRouter);
router.use(exchangeRatesRouter);
router.use(settingsRouter);

export default router;
