import { z } from "zod";

export const TrackingLookupQuery = z.object({
  phone: z.string().min(1),
});

export const TrackingLookupResponse = z.array(
  z.object({
    orderCode: z.string(),
    trackingNumber: z.string().nullable(),
    shippingCarrier: z.string().nullable(),
    shippingFee: z.number().nullable(),
    status: z.string(),
    orderType: z.string(),
    orderDate: z.coerce.date(),
  })
);
