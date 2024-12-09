import { Model } from "..";

const GenericCompany = new Model({
  id: "genericCompany",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Name"),
  }),
});

export default GenericCompany;
export type GenericCompany = typeof GenericCompany;
