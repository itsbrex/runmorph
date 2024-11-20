import { ResourceModel } from "..";

const GenericWorkspace = new ResourceModel({
  id: "genericWorkspace",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Name"),
  }),
});

export type GenericWorkspace = typeof GenericWorkspace;
export default GenericWorkspace;
