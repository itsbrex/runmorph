import { ResourceModel } from "..";

const GenericContact = new ResourceModel({
  id: "genericContact",
  schema: (z) => ({
    firstName: z.string().min(1).max(250).optional().describe("First name"),
    lastName: z.string().min(1).max(250).optional().describe("Last name"),
    email: z.string().email().min(5).max(250).optional().describe("Email"),
    phone: z.string().min(5).max(20).optional().describe("Phone number"),
  }),
});

export type GenericContact = typeof GenericContact;
export default GenericContact;
