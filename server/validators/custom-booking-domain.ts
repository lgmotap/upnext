import { z } from "zod";

const hostSchema = z
  .string()
  .trim()
  .min(3)
  .max(253)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, {
    message: "Enter a valid hostname like book.yourbusiness.com",
  });

export const customBookingHostSchema = z.object({
  customBookingHost: hostSchema,
});

export type CustomBookingHostInput = z.infer<typeof customBookingHostSchema>;
