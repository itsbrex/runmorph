import { ResourceModel } from "..";

const GenericCompany = new ResourceModel({
  id: "genericCompany",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Name"),
  }),
});

export default GenericCompany;
export type GenericCompany = typeof GenericCompany;
