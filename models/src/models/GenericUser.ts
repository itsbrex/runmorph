import { Model } from "..";

const GenericUser = new Model({
  id: "genericUser",
  schema: (z) => ({
    firstName: z.string().min(1).max(250).optional().describe("First name"),
    lastName: z.string().min(1).max(250).optional().describe("Last name"),
    email: z.string().email().min(5).max(250).optional().describe("Email"),
  }),
});

export type GenericUser = typeof GenericUser;
export default GenericUser;
