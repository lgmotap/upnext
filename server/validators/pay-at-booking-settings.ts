import { z } from "zod";

export const payAtBookingSettingsSchema = z
  .object({
    payAtBookingEnabled: z.boolean(),
    requirePaymentAtBooking: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.requirePaymentAtBooking && !data.payAtBookingEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enable pay at booking before requiring payment",
        path: ["requirePaymentAtBooking"],
      });
    }
  });

export type PayAtBookingSettingsInput = z.infer<typeof payAtBookingSettingsSchema>;
