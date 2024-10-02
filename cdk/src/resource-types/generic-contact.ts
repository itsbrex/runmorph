import { z } from "zod";

export const GenericContactSchema = z.object({
  firstName: z.string().min(1).max(250).describe("First name"),
  lastName: z.string().min(1).max(250).optional().describe("Last name"),
  email: z.string().email().min(5).max(250).optional().describe("Email"),
  phone: z.string().min(5).max(20).optional().describe("Phone number"),
});

export type GenericContact = z.infer<typeof GenericContactSchema>;
